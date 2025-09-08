import React from 'react';

interface BulkDeleteModalProps {
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  selectedCount,
  onConfirm,
  onCancel
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          color: '#333'
        }}>
          Confirm Bulk Delete
        </h3>
        
        <p style={{
          margin: '0 0 24px 0',
          color: '#666',
          lineHeight: '1.5'
        }}>
          Are you sure you want to delete {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}? 
          This action cannot be undone.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};
