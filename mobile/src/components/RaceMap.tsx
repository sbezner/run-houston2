import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { RaceVM } from '../types';
import { RacePopup } from './RacePopup';

interface RaceMapProps {
  races: RaceVM[];
  userLocation?: { lat: number; lng: number } | null;
  hasReportByRaceId?: Record<string | number, boolean>;
  onPressReport?: (race: RaceVM) => void;
}

const RaceMap: React.FC<RaceMapProps> = ({ races, userLocation, hasReportByRaceId, onPressReport }) => {
  const [mapRaces, setMapRaces] = useState<RaceVM[]>([]);
  const [selectedRace, setSelectedRace] = useState<RaceVM | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Cleanup modal state when races change
  useEffect(() => {
    if (modalVisible && !selectedRace) {
      setModalVisible(false);
    }
  }, [modalVisible, selectedRace]);



  const handleMarkerPress = (race: RaceVM) => {
    setSelectedRace(race);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRace(null);
  };



  const handleRaceReport = (race: RaceVM) => {
    if (onPressReport) {
      onPressReport(race);
      handleCloseModal();
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
             tappable={true}
             onPress={() => handleMarkerPress(race)}
           />
         ))}
      </MapView>
      
      {/* Custom Race Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCloseModal}
        >
          {selectedRace && (
            <RacePopup
              race={selectedRace}
              onClose={handleCloseModal}
              onPressReport={() => handleRaceReport(selectedRace)}
              hasReport={hasReportByRaceId?.[selectedRace.id] === true}
              userLocation={userLocation}
            />
          )}
        </TouchableOpacity>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RaceMap;
