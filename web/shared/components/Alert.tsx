import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  show?: boolean;
}

export const Alert: React.FC<AlertProps> = ({ 
  type, 
  message, 
  onClose, 
  show = true 
}) => {
  if (!show) return null;

  const typeStyles = {
    success: {
      backgroundColor: '#D1FAE5',
      borderColor: '#10B981',
      textColor: '#065F46',
      icon: '✅'
    },
    error: {
      backgroundColor: '#FEE2E2',
      borderColor: '#EF4444',
      textColor: '#991B1B',
      icon: '❌'
    },
    warning: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      textColor: '#92400E',
      icon: '⚠️'
    },
    info: {
      backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6',
      textColor: '#1E40AF',
      icon: 'ℹ️'
    }
  };

  const style = typeStyles[type];

  return (
    <div style={{
      padding: '1rem',
      margin: '1rem 0',
      borderRadius: '0.5rem',
      border: `1px solid ${style.borderColor}`,
      backgroundColor: style.backgroundColor,
      color: style.textColor,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      position: 'relative'
    }}>
      <span style={{ fontSize: '1.25rem' }}>
        {style.icon}
      </span>
      <span style={{ flex: 1, fontWeight: '500' }}>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: style.textColor,
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '0.25rem',
            borderRadius: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
