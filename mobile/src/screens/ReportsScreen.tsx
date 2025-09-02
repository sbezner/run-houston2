import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { RaceReport } from '../types';
import { fetchRaceReports } from '../api';
import { config } from '../config';

export const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setOffset(0);
        setReports([]);
      }

      const currentOffset = isRefresh ? 0 : offset;
      
      const response = await fetchRaceReports({
        limit,
        offset: currentOffset,
      });

      if (isRefresh) {
        setReports(response.items);
      } else {
        setReports(prev => [...prev, ...response.items]);
      }

      setTotal(response.total);
      setHasMore(response.offset + response.items.length < response.total);
      setOffset(currentOffset + response.items.length);
      setError(null);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports(true);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadReports();
    }
  };

  const openReport = async (report: RaceReport) => {
    try {
      // Try to open the report URL if it exists
      if (report.url) {
        const supported = await Linking.canOpenURL(report.url);
        if (supported) {
          await Linking.openURL(report.url);
        } else {
          throw new Error('Cannot open URL');
        }
      } else {
        // Show report details in an alert if no URL
        Alert.alert(
          report.title || 'Untitled Report',
          `${report.content || 'No content available'}\n\nBy: ${report.author || 'Unknown Author'}\nDate: ${new Date(report.created_at).toLocaleDateString()}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening report:', error);
      // Fallback to showing details in alert
      Alert.alert(
        report.title || 'Untitled Report',
        `${report.content || 'No content available'}\n\nBy: ${report.author || 'Unknown Author'}\nDate: ${new Date(report.created_at).toLocaleDateString()}`,
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    // Add timeout protection for initial load
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError('Loading timeout - check your network connection');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    loadReports(true);

    return () => clearTimeout(timeoutId);
  }, []);

  const renderReport = ({ item }: { item: RaceReport }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => openReport(item)}
      testID={`report-item-${item.id}`}
    >
      <Text style={styles.reportTitle}>{item.title || 'Untitled Report'}</Text>
      <Text style={styles.reportRace}>Race: {item.race_name || 'Unknown Race'}</Text>
      <Text style={styles.reportAuthor}>By: {item.author || 'Unknown Author'}</Text>
      <Text style={styles.reportDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.reportPreview} numberOfLines={2}>
        {item.content || 'No content available'}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && reports.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadReports(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        testID="reports-list"
      />
      {!hasMore && reports.length > 0 && (
        <View style={styles.endMessage}>
          <Text style={styles.endMessageText}>All reports loaded</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  reportRace: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  reportPreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  endMessage: {
    padding: 16,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
