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
import { Club } from '../types';
import { fetchClubs } from '../api';

export const ClubsScreen: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClubs = async () => {
    try {
      const data = await fetchClubs();
      setClubs(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading clubs:', err);
      setError(err?.message || 'Failed to load clubs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClubs();
  };

  const openClubWebsite = async (club: Club) => {
    if (club.website_url) {
      try {
        const supported = await Linking.canOpenURL(club.website_url);
        if (supported) {
          await Linking.openURL(club.website_url);
        } else {
          throw new Error('Cannot open URL');
        }
      } catch (error) {
        console.error('Error opening website:', error);
        Alert.alert('Error', 'Could not open website');
      }
    } else {
      Alert.alert('No Website', 'This club does not have a website');
    }
  };

  const openClubEmail = async (club: Club) => {
    // Email functionality removed since backend doesn't provide email field
    Alert.alert('No Email', 'Email functionality not available for this club');
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const renderClub = ({ item }: { item: Club }) => (
    <View style={styles.clubItem}>
      <Text style={styles.clubName}>{item.club_name}</Text>
      
      {item.location ? (
        <Text style={styles.clubInfo}>📍 {item.location}</Text>
      ) : (
        <Text style={styles.clubDescription}>No location specified</Text>
      )}
      
      <View style={styles.clubActions}>
        {item.website_url && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openClubWebsite(item)}
          >
            <Text style={styles.actionButtonText}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading clubs...</Text>
      </View>
    );
  }

  if (error && clubs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClubs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={clubs}
        renderItem={renderClub}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No clubs found</Text>
              <Text style={styles.emptySubtext}>Check back later for club listings</Text>
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
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  clubItem: {
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
  clubName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  clubDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    lineHeight: 22,
  },
  clubInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  clubActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
