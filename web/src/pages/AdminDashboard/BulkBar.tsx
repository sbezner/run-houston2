import React from 'react';

interface BulkBarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export const BulkBar: React.FC<BulkBarProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete
}) => (
  <div style={{
    backgroundColor: '#007AFF',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <span style={{ fontWeight: '600' }}>
        {selectedCount} race{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onSelectAll}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Select All
      </button>
      <button
        onClick={onClearSelection}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Clear
      </button>
    </div>
    
    <button
      onClick={onBulkDelete}
      style={{
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600'
      }}
    >
      🗑️ Delete Selected
    </button>
  </div>
);
