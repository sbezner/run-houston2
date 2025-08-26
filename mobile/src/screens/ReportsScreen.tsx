import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert
} from 'react-native';
import { fetchRaceReports, fetchRaceReportById } from '../api';
import { RaceReport } from '../types';

export const ReportsScreen = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);




  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      const data = await fetchRaceReports({
        order_by: 'created_at',
        limit,
        offset: 0,
        include_race: true
      });
      setReports(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh reports');
    } finally {
      setRefreshing(false);
    }
  };



  useEffect(() => {
    const loadInitialReports = async () => {
      try {
        const data = await fetchRaceReports({
          order_by: 'created_at',
          limit,
          offset: 0,
          include_race: true
        });
        setReports(data.items);
        setTotal(data.total);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialReports();
  }, []);



  const handleReportPress = (report: RaceReport) => {
    // Navigate to report detail (for now, just show an alert)
    Alert.alert(
      report.title,
      `Race: ${report.race?.name || `Race ${report.race_id}`}\n` +
      `Date: ${new Date(report.race_date).toDateString()}\n` +
      `Author: ${report.author_name || 'Unknown'}\n\n` +
      `${report.content_md.substring(0, 200)}${report.content_md.length > 200 ? '...' : ''}`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toDateString();
  };

  if (loading && reports.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Check that your backend is running</Text>
        <Pressable style={styles.retryButton} onPress={() => {
          setLoading(true);
          setError(null);
          const loadInitialReports = async () => {
            try {
              const data = await fetchRaceReports({
                order_by: 'created_at',
                limit,
                offset: 0,
                include_race: true
              });
                      setReports(data.items);
        setTotal(data.total);
        setError(null);
            } catch (err: any) {
              setError(err.message || 'Failed to load reports');
            } finally {
              setLoading(false);
            }
          };
          loadInitialReports();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const renderReport = ({ item }: { item: RaceReport }) => (
    <Pressable style={styles.reportCard} onPress={() => handleReportPress(item)}>
      <Text style={styles.reportTitle}>{item.title}</Text>
      
      {/* Author field removed */}
      
      <View style={styles.reportInfo}>
        <Text style={styles.reportDetail}>
          🏁 {item.race?.name || `Race ${item.race_id}`}
        </Text>
        <Text style={styles.reportDetail}>
          📅 {formatDate(item.race_date)}
        </Text>
        <Text style={styles.reportDetail}>
          📝 {formatDate(item.created_at)}
        </Text>
      </View>
      
      <Text style={styles.contentPreview} numberOfLines={3}>
        {item.content_md}
      </Text>
      
      <View style={styles.openButton}>
        <Text style={styles.openButtonText}>Open</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>


      {/* Reports List */}
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReport}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No race reports found</Text>
            <Text style={styles.emptySubtext}>
              Check back soon for race reports
            </Text>
          </View>
        }

      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },




  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },

  reportInfo: {
    marginBottom: 12,
  },
  reportDetail: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 4,
  },
  contentPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  openButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  openButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
