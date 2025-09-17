import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ClubMapProps {
  clubs: any[];
  onClubSelect?: (club: any) => void;
}

// Component to handle map center updates
const MapCenterHandler: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

// Hardcoded coordinates for common locations (fallback for geocoding)
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Houston TX": { lat: 29.7604, lng: -95.3698 },
  "Clear Lake TX": { lat: 29.5636, lng: -95.0883 },
  "The Woodlands TX": { lat: 30.1658, lng: -95.4613 },
  "Austin TX": { lat: 30.2672, lng: -97.7431 },
  "Dallas TX": { lat: 32.7767, lng: -96.7970 },
  "San Antonio TX": { lat: 29.4241, lng: -98.4936 },
  "Katy TX": { lat: 29.7858, lng: -95.8244 },
  "Sugar Land TX": { lat: 29.6197, lng: -95.6349 },
  "Cypress TX": { lat: 29.9691, lng: -95.6972 }
};

// Function to create clustered coordinates for multiple clubs in the same location
const createClusteredCoordinates = (baseLocation: string, clubsAtLocation: any[]): { lat: number; lng: number }[] => {
  const baseCoords = locationCoordinates[baseLocation] || { lat: 29.7604, lng: -95.3698 };
  
  if (clubsAtLocation.length === 1) {
    return [baseCoords];
  }
  
  // Create a small cluster around the base location
  const clusterRadius = 0.01; // Approximately 1km radius
  const angleStep = (2 * Math.PI) / clubsAtLocation.length;
  
  return clubsAtLocation.map((club, index) => {
    const angle = index * angleStep;
    // Use club ID for deterministic positioning instead of random
    const randomSeed = club.id % 10; // Use club ID for consistent positioning
    const offset = clusterRadius * (0.3 + (randomSeed / 10) * 0.4); // 0.3 to 0.7 of radius
    
    return {
      lat: baseCoords.lat + (offset * Math.cos(angle)),
      lng: baseCoords.lng + (offset * Math.sin(angle))
    };
  });
};

// Geocoding function using OpenStreetMap Nominatim (free)
const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  // First check hardcoded coordinates
  if (locationCoordinates[location]) {
    return locationCoordinates[location];
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=us`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.warn('Geocoding failed for location:', location, error);
  }
  
  // Fallback to Houston coordinates
  return { lat: 29.7604, lng: -95.3698 };
};

export const ClubMap: React.FC<ClubMapProps> = ({ clubs, onClubSelect }) => {
  const [mapClubs, setMapClubs] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([29.7604, -95.3698]); // Houston center
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const geocodeClubs = async () => {
      // Group clubs by location for clustering
      const clubsByLocation: Record<string, any[]> = {};
      
      clubs.forEach(club => {
        const location = club.location || 'Unknown';
        if (!clubsByLocation[location]) {
          clubsByLocation[location] = [];
        }
        clubsByLocation[location].push(club);
      });
      
      // Create clustered coordinates for each location
      const clubsWithCoordinates: any[] = [];
      
      for (const [location, clubsAtLocation] of Object.entries(clubsByLocation)) {
        const clusteredCoords = createClusteredCoordinates(location, clubsAtLocation);
        
        clubsAtLocation.forEach((club, index) => {
          clubsWithCoordinates.push({
            ...club,
            latitude: clusteredCoords[index]?.lat || 29.7604,
            longitude: clusteredCoords[index]?.lng || -95.3698
          });
        });
      }
      
      setMapClubs(clubsWithCoordinates);
      setGeocodingComplete(true);
    };

    geocodeClubs();
  }, [clubs]);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation([userLat, userLng]);
          setMapCenter([userLat, userLng]);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Keep default Houston center
        }
      );
    }
  }, []);

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation([userLat, userLng]);
          setMapCenter([userLat, userLng]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  };

  const handleMarkerClick = (club: any) => {
    if (onClubSelect) {
      onClubSelect(club);
    }
  };

  if (!geocodingComplete) {
    return (
      <div style={{ 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Loading club locations...</h3>
          <p style={{ color: '#9ca3af' }}>Geocoding club addresses</p>
        </div>
      </div>
    );
  }

  if (mapClubs.length === 0) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No clubs with location data</h3>
          <p style={{ color: '#9ca3af' }}>Try refreshing or check back later</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '600px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <MapCenterHandler center={mapCenter} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {mapClubs.map((club) => (
          <Marker
            key={club.id}
            position={[club.latitude, club.longitude]}
            eventHandlers={{
              click: () => handleMarkerClick(club),
            }}
          >
            <Popup>
              <div style={{ minWidth: '250px', padding: '8px' }}>
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#1f2937',
                  lineHeight: '1.3'
                }}>
                  🏃‍♂️ {club.club_name}
                </h3>
                
                {club.location && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    <span style={{ marginRight: '6px' }}>📍</span>
                    <span>{club.location}</span>
                    {mapClubs.filter(c => c.location === club.location).length > 1 && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 6px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {mapClubs.filter(c => c.location === club.location).length} clubs in area
                      </span>
                    )}
                  </div>
                )}
                
                
                {club.description && (
                  <div style={{ 
                    marginBottom: '12px',
                    color: '#4b5563',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {club.description}
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap' 
                }}>
                  {club.website_url && (
                    <a
                      href={club.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        backgroundColor: '#007AFF',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0056CC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#007AFF';
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>🌐</span>
                      Website
                    </a>
                  )}
                  
                  <button
                    onClick={() => {
                      const query = encodeURIComponent(`${club.club_name} ${club.location}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      backgroundColor: '#34D399',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#10B981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#34D399';
                    }}
                  >
                    <span style={{ marginRight: '4px' }}>🗺️</span>
                    Directions
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Floating center button */}
      <button
        onClick={handleCenterOnUser}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        <span style={{ marginRight: '6px' }}>📍</span>
        Center on Me
      </button>
    </div>
  );
};
