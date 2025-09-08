import React, { useState } from 'react';
import { RaceForm } from "@shared/components/RaceForm";
import { handleApiError } from "@shared/utils/apiErrorHandler";

interface Race {
  id: number;
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

interface EditRaceModalProps {
  race: Race;
  onSave: (raceData: any) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditRaceModal: React.FC<EditRaceModalProps> = ({ race, onSave, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (raceData: any) => {
    setLoading(true);
    try {
      await onSave(raceData);
      onSuccess();
    } catch (error) {
      console.error('Error updating race:', error);
      const errorMessage = handleApiError(error instanceof Error ? error : new Error('Unknown error'));
      alert(`Failed to update race: ${errorMessage}`);
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
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90vw',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            Edit Race: {race.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          <RaceForm
            mode="edit"
            initialData={race}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
