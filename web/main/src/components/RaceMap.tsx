import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Using any type to match RacesPage pattern

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RaceMapProps {
  races: any[];
  onRaceSelect?: (race: any) => void;
}

// Component to handle map center updates
const MapCenterHandler: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

export const RaceMap: React.FC<RaceMapProps> = ({ races, onRaceSelect }) => {
  const [mapRaces, setMapRaces] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([29.7604, -95.3698]); // Houston center
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Filter races with valid coordinates
    const validRaces = races.filter(
      race => race.latitude && race.longitude && 
      !isNaN(race.latitude) && !isNaN(race.longitude)
    );
    setMapRaces(validRaces);
  }, [races]);

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

  const handleMarkerClick = (race: any) => {
    if (onRaceSelect) {
      onRaceSelect(race);
    }
  };

  if (mapRaces.length === 0) {
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
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No races with location data</h3>
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
        
        {mapRaces.map((race) => (
          <Marker
            key={race.id}
            position={[race.latitude!, race.longitude!]}
            eventHandlers={{
              click: () => handleMarkerClick(race),
            }}
          >
            <Popup>
              <div style={{ 
                minWidth: '280px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#1f2937',
                  lineHeight: '1.3'
                }}>
                  {race.name}
                </h4>
                
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  {/* Date */}
                  <div style={{ marginBottom: '6px' }}>
                    📅 {new Date(race.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  {/* Start Time */}
                  {race.start_time && (
                    <div style={{ marginBottom: '6px' }}>
                      🕐 {race.start_time}
                    </div>
                  )}
                  
                  {/* Location */}
                  {(race.city || race.state) && (
                    <div style={{ marginBottom: '6px' }}>
                      📍 {[race.city, race.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  
                  {/* Distance */}
                  {race.distance && (
                    <div style={{ marginBottom: '6px' }}>
                      🏃 {Array.isArray(race.distance) ? race.distance.join(', ') : race.distance}
                    </div>
                  )}
                  
                  {/* Surface */}
                  {race.surface && (
                    <div style={{ marginBottom: '6px' }}>
                      🛤️ {race.surface}
                    </div>
                  )}
                  
                  {/* Kid Friendly */}
                  {race.kid_run !== undefined && (
                    <div style={{ marginBottom: '6px' }}>
                      👶 {race.kid_run ? 'Kid-friendly' : 'Adults only'}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap'
                }}>
                  {race.official_website_url && (
                    <a 
                      href={race.official_website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                      }}
                    >
                      🌐 Website
                    </a>
                  )}
                  
                  {/* Directions Button */}
                  {race.latitude && race.longitude && (
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${race.latitude},${race.longitude}`;
                        window.open(url, '_blank');
                      }}
                      style={{ 
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#10b981';
                      }}
                    >
                      🧭 Directions
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Floating location button */}
      <button
        onClick={handleCenterOnUser}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        title="Center on my location"
      >
        📍
      </button>
    </div>
  );
};
