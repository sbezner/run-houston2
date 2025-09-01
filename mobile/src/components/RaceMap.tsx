import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { RaceVM } from '../types';

interface RaceMapProps {
  races: RaceVM[];
}

const RaceMap: React.FC<RaceMapProps> = ({ races }) => {
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
           <View style={styles.modalContent}>
             {selectedRace && (
               <>
                 <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>{selectedRace.name}</Text>
                   <TouchableOpacity 
                     style={styles.closeButton}
                     onPress={handleCloseModal}
                   >
                     <Text style={styles.closeButtonText}>✕</Text>
                   </TouchableOpacity>
                 </View>
                 
                 <View style={styles.modalBody}>
                   <Text style={styles.modalDate}>
                     📅 {new Date(selectedRace.dateISO).toLocaleDateString()}
                     {selectedRace.startTime && ` at ${selectedRace.startTime}`}
                   </Text>
                   
                   <Text style={styles.modalSurface}>
                     🏃 {selectedRace.surface || 'Unknown'} Surface
                   </Text>
                   
                   {selectedRace.distances && selectedRace.distances.length > 0 && (
                     <Text style={styles.modalDistances}>
                       📏 {selectedRace.distances.join(', ')}
                     </Text>
                   )}
                   
                   {selectedRace.city && selectedRace.state && (
                     <Text style={styles.modalLocation}>
                       📍 {selectedRace.city}, {selectedRace.state}
                     </Text>
                   )}
                   
                   {selectedRace.kidRun && (
                     <Text style={styles.modalKids}>👶 Kids Run Available</Text>
                   )}
                 </View>
                 
                 <View style={styles.modalActions}>
                   {selectedRace.url && (
                     <TouchableOpacity 
                       style={styles.modalButton} 
                       onPress={() => {
                         openRaceWebsite(selectedRace.url!);
                         handleCloseModal();
                       }}
                     >
                       <Text style={styles.modalButtonText}>🌐 Visit Website</Text>
                     </TouchableOpacity>
                   )}
                   
                   {/* TODO: Show Race Reports button only when there are actual reports */}
                   {/* For now, this is hidden until we implement race reports */}
                   {/* 
                   {selectedRace.raceReports && selectedRace.raceReports.length > 0 && (
                     <TouchableOpacity 
                       style={[styles.modalButton, styles.secondaryButton]}
                       onPress={() => {
                         // TODO: Navigate to race reports when implemented
                         setModalVisible(false);
                       }}
                     >
                       <Text style={styles.modalButtonText}>📝 Race Reports ({selectedRace.raceReports.length})</Text>
                     </TouchableOpacity>
                   )}
                   */}
                 </View>
               </>
             )}
           </View>
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalSurface: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalDistances: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  modalLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalKids: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalActions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RaceMap;
