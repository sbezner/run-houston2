import React, { useState, useEffect } from 'react';

// CSS to hide clear button on race name field
const raceNameInputStyles = `
  input[type="text"]::-webkit-search-cancel-button,
  input[type="text"]::-webkit-search-decoration,
  input[type="text"]::-webkit-search-results-button,
  input[type="text"]::-webkit-search-results-decoration {
    -webkit-appearance: none;
    appearance: none;
  }
`;

interface Race {
  id?: number;
  name: string;
  date: string;
  start_time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  surface?: string;
  distance?: string[];
  kid_run?: boolean;
  official_website_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
}

interface RaceFormProps {
  mode: 'create' | 'edit';
  initialData?: Race;
  onSubmit: (raceData: Race) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const availableDistances = ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other'];
const availableSurfaces = ['road', 'trail', 'track', 'virtual', 'other'];

// User-friendly display labels for distances
const distanceDisplayLabels: Record<string, string> = {
  '5k': '5K',
  '10k': '10K', 
  'half marathon': 'Half Marathon',
  'marathon': 'Marathon',
  'ultra': 'Ultra',
  'other': 'Other'
};

const defaultRaceData: Race = {
  name: '',
  date: '',
  start_time: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  surface: 'road',
  distance: ['5k'],
  kid_run: false,
  official_website_url: '',
  latitude: null,
  longitude: null,
  source: 'web_interface'
};

export const RaceForm: React.FC<RaceFormProps> = ({ 
  mode, 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<Race>(defaultRaceData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Initialize form data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultRaceData,
        ...initialData
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDistanceToggle = (distance: string) => {
    setFormData(prev => ({
      ...prev,
      distance: (prev.distance || []).includes(distance)
        ? (prev.distance || []).filter(d => d !== distance)
        : [...(prev.distance || []), distance]
    }));
  };

  const getCoordinatesFromAddress = async () => {
    if (!formData.address?.trim() || !formData.city?.trim() || !formData.state?.trim()) {
      alert('Please fill in address, city, and state before getting coordinates.');
      return;
    }

    setGeocodingLoading(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip || ''}`.trim();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }));
        // Clear any existing coordinate errors
        setErrors(prev => ({ ...prev, latitude: '', longitude: '' }));
      } else {
        alert('Address not found. Please check the address and try again, or enter coordinates manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to get coordinates. Please enter them manually or try again later.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Race name is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.surface) newErrors.surface = 'Surface type is required';
    if (!formData.distance || formData.distance.length === 0) {
      newErrors.distance = 'At least one distance is required';
    }
    
    if (formData.latitude !== null && formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude !== null && formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert surface to lowercase before submission for backend compatibility
    const normalizedFormData = {
      ...formData,
      surface: formData.surface ? formData.surface.toLowerCase() : formData.surface
    };

    console.log('Form data being sent:', normalizedFormData);

    await onSubmit(normalizedFormData);
  };

  // const getTitle = () => mode === 'create' ? 'Create New Race' : 'Edit Race';
  const getSubmitText = () => loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Race' : 'Update Race');
  const getSubmitButtonColor = () => mode === 'create' ? '#10b981' : '#3b82f6';

  return (
    <>
      <style>{raceNameInputStyles}</style>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Race Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: `2px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: errors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
              }}
              placeholder="Enter race name"
              autoComplete="off"
              spellCheck="false"
              onFocus={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.name && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.name}</p>}
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
                             style={{
                 width: '100%',
                 padding: '10px',
                 border: `2px solid ${errors.date ? '#ef4444' : '#e5e7eb'}`,
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s',
                 boxShadow: errors.date ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
               }}
              onFocus={(e) => {
                if (!errors.date) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.date) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.date && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.date}</p>}
          </div>

          {/* Start Time */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Start Time *
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
                             style={{
                 width: '100%',
                 padding: '10px',
                 border: `2px solid ${errors.start_time ? '#ef4444' : '#e5e7eb'}`,
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s',
                 boxShadow: errors.start_time ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
               }}
              onFocus={(e) => {
                if (!errors.start_time) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.start_time) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.start_time && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.start_time}</p>}
          </div>

          {/* Address */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Address
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                                 style={{
                   flex: 1,
                   padding: '10px',
                   border: '2px solid #e5e7eb',
                   borderRadius: '8px',
                   fontSize: '14px',
                   transition: 'border-color 0.2s, box-shadow 0.2s'
                 }}
                placeholder="Enter street address"
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={getCoordinatesFromAddress}
                disabled={geocodingLoading}
                style={{
                  padding: '12px 20px',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  backgroundColor: geocodingLoading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  cursor: geocodingLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  transition: 'all 0.2s',
                  boxShadow: geocodingLoading ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!geocodingLoading) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!geocodingLoading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                  }
                }}
              >
                {geocodingLoading ? 'Getting...' : 'Get Coordinates'}
              </button>
            </div>
          </div>

          {/* City */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
                             style={{
                 width: '100%',
                 padding: '10px',
                 border: `2px solid ${errors.city ? '#ef4444' : '#e5e7eb'}`,
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s',
                 boxShadow: errors.city ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
               }}
              placeholder="Enter city"
              onFocus={(e) => {
                if (!errors.city) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.city) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.city && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.city}</p>}
          </div>

          {/* State */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              State *
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
                             style={{
                 width: '100%',
                 padding: '10px',
                 border: `2px solid ${errors.state ? '#ef4444' : '#e5e7eb'}`,
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s',
                 boxShadow: errors.state ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
               }}
              placeholder="Enter state"
              onFocus={(e) => {
                if (!errors.state) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.state) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.state && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.state}</p>}
          </div>

          {/* Zip Code */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Zip Code
            </label>
                         <input
               type="text"
               value={formData.zip}
               onChange={(e) => handleInputChange('zip', e.target.value)}
               style={{
                 width: '100%',
                 padding: '10px',
                 border: '2px solid #e5e7eb',
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s'
               }}
               placeholder="Enter zip code"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div>

                    {/* Surface */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Surface Type *
            </label>
            <select
              value={formData.surface}
              onChange={(e) => handleInputChange('surface', e.target.value)}
                             style={{
                 width: '100%',
                 padding: '10px',
                 border: `2px solid ${errors.surface ? '#ef4444' : '#e5e7eb'}`,
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s',
                 boxShadow: errors.surface ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                 backgroundColor: 'white'
               }}
              onFocus={(e) => {
                if (!errors.surface) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!errors.surface) {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {availableSurfaces.map(surface => (
                <option key={surface} value={surface}>
                  {surface.charAt(0).toUpperCase() + surface.slice(1)}
                </option>
              ))}
            </select>
            {errors.surface && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.surface}</p>}
          </div>

          {/* Kid-Friendly Race */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              margin: 0
            }}>
              <input
                type="checkbox"
                checked={formData.kid_run}
                onChange={(e) => handleInputChange('kid_run', e.target.checked)}
                style={{ 
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px',
                  accentColor: '#10b981'
                }}
              />
              <div>
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  display: 'block'
                }}>
                  Kid-Friendly Race
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  display: 'block',
                  marginTop: '1px'
                }}>
                  Check if this race is suitable for children
                </span>
              </div>
            </label>
          </div>

          {/* Distance */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Available Distances *
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              {availableDistances.map(distance => (
                <label key={distance} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={(formData.distance || []).includes(distance)}
                    onChange={() => handleDistanceToggle(distance)}
                    style={{ 
                      cursor: 'pointer',
                      width: '14px',
                      height: '14px',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {distanceDisplayLabels[distance]}
                  </span>
                </label>
              ))}
            </div>
            {errors.distance && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444' }}>{errors.distance}</p>}
          </div>

                    {/* Official Website */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Official Website
            </label>
                         <input
               type="url"
               value={formData.official_website_url}
               onChange={(e) => handleInputChange('official_website_url', e.target.value)}
               style={{
                 width: '100%',
                 padding: '10px',
                 border: '2px solid #e5e7eb',
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s'
               }}
               placeholder="https://example.com"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Coordinates */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Coordinates
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>
                  Latitude
                </label>
                                 <input
                   type="number"
                   step="any"
                   value={formData.latitude || ''}
                   onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                   style={{
                     width: '100%',
                     padding: '10px',
                     border: `2px solid ${errors.latitude ? '#ef4444' : '#e5e7eb'}`,
                     borderRadius: '8px',
                     fontSize: '14px',
                     transition: 'border-color 0.2s, box-shadow 0.2s',
                     boxShadow: errors.latitude ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
                   }}
                   placeholder="29.7604"
                  onFocus={(e) => {
                    if (!errors.latitude) {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.latitude) {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.latitude && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.latitude}</p>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>
                  Longitude
                </label>
                                 <input
                   type="number"
                   step="any"
                   value={formData.longitude || ''}
                   onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                   style={{
                     width: '100%',
                     padding: '10px',
                     border: `2px solid ${errors.longitude ? '#ef4444' : '#e5e7eb'}`,
                     borderRadius: '8px',
                     fontSize: '14px',
                     transition: 'border-color 0.2s, box-shadow 0.2s',
                     boxShadow: errors.longitude ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
                   }}
                   placeholder="-95.3698"
                  onFocus={(e) => {
                    if (!errors.longitude) {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.longitude) {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.longitude && <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.longitude}</p>}
              </div>
            </div>
            
          </div>

          {/* Source */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
              Source
            </label>
                         <input
               type="text"
               value={formData.source}
               onChange={(e) => handleInputChange('source', e.target.value)}
               style={{
                 width: '100%',
                 padding: '10px',
                 border: '2px solid #e5e7eb',
                 borderRadius: '8px',
                 fontSize: '14px',
                 transition: 'border-color 0.2s, box-shadow 0.2s'
               }}
               placeholder="web_interface"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '16px',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '2px solid #f3f4f6'
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            minWidth: '100px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.color = '#374151';
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: loading ? '#9ca3af' : getSubmitButtonColor(),
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            minWidth: '120px',
            boxShadow: loading ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }
          }}
        >
          {getSubmitText()}
        </button>
      </div>
    </form>
    </>
  );
};

