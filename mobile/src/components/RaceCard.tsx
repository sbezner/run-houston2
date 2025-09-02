import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { RaceVM } from '../types';
import { milesBetween } from '../utils/geo';

interface RaceCardProps {
  race: RaceVM;
  onPress: () => void;
  onPressReport?: () => void;
  hasReport?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export function RaceCard({ race, onPress, onPressReport, hasReport, userLocation }: RaceCardProps) {
  const formatDate = (dateISO: string | null | undefined): string => {
    if (!dateISO) return '';
    try {
      const date = new Date(dateISO);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    } catch {
      return '';
    }
  };

  const formatTime = (startTime: string | null | undefined): string => {
    if (!startTime) return '';
    try {
      const [hours, minutes] = startTime.split(':');
      const hour = parseInt(hours, 10);
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return ` • ${displayHour}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const formatLocation = (): string => {
    const parts = [];
    if (race.city) parts.push(race.city);
    if (race.state) parts.push(race.state);
    return parts.length > 0 ? ` • ${parts.join(', ')}` : '';
  };

  const formatFullAddress = (): string => {
    const parts = [];
    if (race.address) parts.push(race.address);
    if (race.city) parts.push(race.city);
    if (race.state) parts.push(race.state);
    if (race.zip) parts.push(race.zip);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  const getDistanceFromUser = (): string | null => {
    if (!userLocation || !race.latitude || !race.longitude) return null;
    const distance = milesBetween(userLocation, { lat: race.latitude, lng: race.longitude });
    return `${distance.toFixed(1)} mi away`;
  };

  const handleOpenDirections = () => {
    if (!race.latitude || !race.longitude) return;
    
    // Use the most direct URL scheme for fastest opening
    const url = `comgooglemaps://?daddr=${race.latitude},${race.longitude}&directionsmode=driving`;
    
    // Try Google Maps app first (fastest), fallback to web
    Linking.openURL(url).catch(() => {
      // Fallback to web version
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${race.latitude},${race.longitude}`;
      Linking.openURL(webUrl);
    });
  };

  const handleOpenWebsite = () => {
    if (race.url) {
      Linking.openURL(race.url);
    }
  };

  const getDistanceBadges = () => {
    return race.distances?.map((distance, index) => (
      <View key={index} style={styles.badge}>
        <Text style={styles.badgeText}>{distance}</Text>
      </View>
    )) || [];
  };

  const getSurfaceBadge = () => {
    if (!race.surface) return null;
    const surfaceStyle = getSurfaceBadgeStyle(race.surface);
    return (
      <View style={[styles.badge, surfaceStyle]}>
        <Text style={[styles.badgeText, { color: surfaceStyle.color }]}>
          {race.surface.charAt(0).toUpperCase() + race.surface.slice(1)}
        </Text>
      </View>
    );
  };

  const getSurfaceBadgeStyle = (surface: string) => {
    const styles = {
      road: { backgroundColor: '#e3f2fd', color: '#1976d2' },
      trail: { backgroundColor: '#e8f5e8', color: '#2e7d32' },
      track: { backgroundColor: '#fff3e0', color: '#f57c00' },
      virtual: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
      other: { backgroundColor: '#f0f0f0', color: '#333' }
    };
    return styles[surface as keyof typeof styles] || styles.other;
  };

  const getKidsBadge = () => {
    if (!race.kidRun) return null;
    return (
      <View style={[styles.badge, styles.kidsBadge]}>
        <Text style={styles.badgeText}>Kids</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Row 1: Title + buttons */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {race.name}
        </Text>
        <View style={styles.actionsRow}>
          {hasReport && (
            <TouchableOpacity
              style={[styles.chipButton, styles.reportButton]}
              onPress={onPressReport}
              accessibilityLabel="Open race report"
            >
              <Text style={styles.chipButtonText}>Race Report</Text>
            </TouchableOpacity>
          )}
          {race.url && (
            <TouchableOpacity style={[styles.chipButton, styles.openButton]} onPress={handleOpenWebsite}>
              <Text style={styles.chipButtonText}>Open ↗</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Row 2: Meta info */}
      <Text style={styles.meta}>
        {formatDate(race.dateISO)}
        {formatTime(race.startTime)}
      </Text>

      {/* Row 3: Full address */}
      {formatFullAddress() && (
        <Text style={styles.address}>
          {formatFullAddress()}
        </Text>
      )}

      {/* Row 4: Distance from user with directions */}
      {getDistanceFromUser() && (
        <View style={styles.distanceRow}>
          <Text style={styles.distance}>
            {getDistanceFromUser()}
          </Text>
          <TouchableOpacity 
            onPress={handleOpenDirections} 
            style={styles.directionsButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.directionsText}>Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Row 5: Badges */}
      <View style={styles.badgeRow}>
        {getDistanceBadges()}
        {getSurfaceBadge()}
        {getKidsBadge()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openButton: {
    backgroundColor: '#007AFF',
  },
  reportButton: {
    backgroundColor: '#34C759',
  },
  chipButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  address: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    lineHeight: 14,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  distance: {
    fontSize: 11,
    color: '#007AFF',
    lineHeight: 14,
    fontWeight: '500',
  },
  directionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  directionsText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },

  kidsBadge: {
    backgroundColor: '#fff3e0',
  },
  badgeText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
});
