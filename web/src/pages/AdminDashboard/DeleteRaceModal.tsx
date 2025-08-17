import React from 'react';
import type { Race } from '../../types';

interface DeleteRaceModalProps {
  race: Race;
  onDelete: (raceId: number) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteRaceModal: React.FC<DeleteRaceModalProps> = ({
  race,
  onDelete,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(race.id);
      onSuccess();
    } catch (error) {
      console.error('Delete failed:', error);
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Delete Race</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Are you sure you want to delete "{race.name}"? This action cannot be undone.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Deleting...' : 'Delete Race'}
          </button>
        </div>
      </div>
    </div>
  );
};
