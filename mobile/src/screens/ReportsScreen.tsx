import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { fetchRaceReports, fetchRaceReportById } from '../api';
import { RaceReport } from '../types';

export const ReportsScreen = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<'created_at' | 'race_date'>('created_at');
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setOffset(0);
        setHasMore(true);
      }
      
      const currentOffset = isRefresh ? 0 : offset;
      const data = await fetchRaceReports({
        q: searchQuery || undefined,
        order_by: orderBy,
        limit,
        offset: currentOffset,
        include_race: true
      });
      
      if (isRefresh) {
        setReports(data.items);
      } else {
        setReports(prev => [...prev, ...data.items]);
      }
      
      setTotal(data.total);
      setHasMore(currentOffset + limit < data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    setOffset(prev => prev + limit);
    await loadReports();
  };

  useEffect(() => {
    loadReports(true);
  }, [searchQuery, orderBy]);

  const handleSearch = () => {
    loadReports(true);
  };

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
        <Pressable style={styles.retryButton} onPress={() => loadReports(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const renderReport = ({ item }: { item: RaceReport }) => (
    <Pressable style={styles.reportCard} onPress={() => handleReportPress(item)}>
      <Text style={styles.reportTitle}>{item.title}</Text>
      
      {item.author_name && (
        <Text style={styles.authorText}>By {item.author_name}</Text>
      )}
      
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
      {/* Search and Filter Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Race Reports</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterChips}>
            <Pressable
              style={[
                styles.filterChip,
                orderBy === 'created_at' ? styles.filterChipActive : styles.filterChipInactive
              ]}
              onPress={() => setOrderBy('created_at')}
            >
              <Text style={[
                styles.filterChipText,
                orderBy === 'created_at' ? styles.filterChipTextActive : styles.filterChipTextInactive
              ]}>
                Newest
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterChip,
                orderBy === 'race_date' ? styles.filterChipActive : styles.filterChipInactive
              ]}
              onPress={() => setOrderBy('race_date')}
            >
              <Text style={[
                styles.filterChipText,
                orderBy === 'race_date' ? styles.filterChipTextActive : styles.filterChipTextInactive
              ]}>
                Race Date
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

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
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No race reports found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Check back soon for race reports'}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore && reports.length > 0 ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipInactive: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipTextInactive: {
    color: '#6c757d',
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
  authorText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
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
  loadingMore: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
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
