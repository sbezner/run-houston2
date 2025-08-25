import React, { useState } from 'react';
import { RaceForm } from '../../components/RaceForm';
import { api } from '../../services/api';
import { handleApiError } from '../../utils/apiErrorHandler';

interface CreateRaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRaceModal: React.FC<CreateRaceModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (raceData: any) => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      await api.post('/races', {
        name: raceData.name,
        date: raceData.date,
        start_time: raceData.start_time,
        address: raceData.address,
        city: raceData.city,
        state: raceData.state,
        zip: raceData.zip,
        surface: raceData.surface,
        distance: raceData.distance,
        kid_run: raceData.kid_run,
        official_website_url: raceData.official_website_url,
        latitude: raceData.latitude,
        longitude: raceData.longitude,
        source: raceData.source
      }, adminToken);

      onSuccess();
    } catch (error) {
      console.error('Error creating race:', error);
      const errorMessage = handleApiError(error instanceof Error ? error : new Error('Unknown error'));
      alert(`Failed to create race: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Create New Race
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#9ca3af',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#4b5563';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            ×
          </button>
        </div>
        
                <RaceForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>
  );
};
