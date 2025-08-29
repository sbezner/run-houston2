import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Race } from '../types';
import { fetchRaces } from '../api';

interface RaceMapProps {
  races: Race[];
  onRacePress?: (race: Race) => void;
}

const RaceMap: React.FC<RaceMapProps> = ({ races, onRacePress }) => {
  const [mapRaces, setMapRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (races && races.length > 0) {
      // Filter races with valid coordinates
      const validRaces = races.filter(
        race => race.latitude && race.longitude && 
        !isNaN(race.latitude) && !isNaN(race.longitude)
      );
      setMapRaces(validRaces);
      setLoading(false);
    } else {
      // Load races if none provided
      loadRaces();
    }
  }, [races]);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const data = await fetchRaces();
      const validRaces = data.filter(
        race => race.latitude && race.longitude && 
        !isNaN(race.latitude) && !isNaN(race.longitude)
      );
      setMapRaces(validRaces);
      setError(null);
    } catch (err: any) {
      console.error('Error loading races for map:', err);
      setError(err?.message || 'Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  const handleRacePress = (race: Race) => {
    if (onRacePress) {
      onRacePress(race);
    } else {
      // Default behavior: show race details
      showRaceDetails(race);
    }
  };

  const showRaceDetails = (race: Race) => {
    const raceDate = new Date(race.date).toLocaleDateString();
    const raceTime = race.time ? ` at ${race.time}` : '';
    
    Alert.alert(
      race.title,
      `Date: ${raceDate}${raceTime}\n` +
      `Surface: ${race.surface}\n` +
      `Distance: ${race.distance} ${race.distance_unit}\n` +
      `Location: ${race.location}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(race.url ? [{
          text: 'Visit Website',
          onPress: () => openRaceWebsite(race.url!)
        }] : []),
      ]
    );
  };

  const openRaceWebsite = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Could not open website');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRaces}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mapRaces.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No races with location data found</Text>
        <Text style={styles.emptySubtext}>Try refreshing or check back later</Text>
      </View>
    );
  }

  // Calculate map region based on race coordinates
  const getMapRegion = () => {
    if (mapRaces.length === 0) {
      return {
        latitude: 29.7604, // Houston default
        longitude: -95.3698,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const lats = mapRaces.map(race => race.latitude!);
    const lngs = mapRaces.map(race => race.longitude!);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latDelta = (maxLat - minLat) * 1.2; // Add 20% padding
    const lngDelta = (maxLng - minLng) * 1.2;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mapRaces.map((race) => (
          <Marker
            key={race.id}
            coordinate={{
              latitude: race.latitude!,
              longitude: race.longitude!,
            }}
            title={race.title}
            description={`${race.date} - ${race.surface} Surface`}
            onPress={() => handleRacePress(race)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{race.title}</Text>
                <Text style={styles.calloutDate}>{new Date(race.date).toLocaleDateString()}</Text>
                <Text style={styles.calloutSurface}>{race.surface} Surface</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
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
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  calloutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  calloutSurface: {
    fontSize: 12,
    color: '#999',
  },
});

export default RaceMap;
