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
import { RaceVM } from '../types';

interface RaceMapProps {
  races: RaceVM[];
  onRacePress?: (race: RaceVM) => void;
}

const RaceMap: React.FC<RaceMapProps> = ({ races, onRacePress }) => {
  const [mapRaces, setMapRaces] = useState<RaceVM[]>([]);

  useEffect(() => {
    if (races && races.length > 0) {
      // Filter races with valid coordinates
      const validRaces = races.filter(
        race => race.latitude && race.longitude && 
        !isNaN(race.latitude) && !isNaN(race.longitude)
      );
      setMapRaces(validRaces);
    } else {
      setMapRaces([]);
    }
  }, [races]);



  const handleRacePress = (race: RaceVM) => {
    if (onRacePress) {
      onRacePress(race);
    } else {
      // Default behavior: show race details
      showRaceDetails(race);
    }
  };

  const showRaceDetails = (race: RaceVM) => {
    const raceDate = new Date(race.dateISO).toLocaleDateString();
    const raceTime = race.startTime ? ` at ${race.startTime}` : '';
    
    Alert.alert(
      race.name,
      `Date: ${raceDate}${raceTime}\n` +
      `Surface: ${race.surface || 'N/A'}\n` +
      `Distance: ${race.distances?.join(', ') || 'N/A'}\n` +
      `Location: ${race.city || 'N/A'}, ${race.state || 'N/A'}`,
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

  // No loading state needed - races are passed as props
  // No error state needed - errors are handled by parent component

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
            title={race.name}
            description={`${race.dateISO} - ${race.surface || 'Unknown'} Surface`}
            onPress={() => handleRacePress(race)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{race.name}</Text>
                <Text style={styles.calloutDate}>{new Date(race.dateISO).toLocaleDateString()}</Text>
                <Text style={styles.calloutSurface}>{race.surface || 'Unknown'} Surface</Text>
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
  // Loading and error styles removed - no longer needed
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
