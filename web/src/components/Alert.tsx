import React from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export const Alert: React.FC<AlertProps> = ({ message, type }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724'
        };
      case 'error':
        return {
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24'
        };
      case 'warning':
        return {
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404'
        };
      default:
        return {};
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '';
    }
  };

  return (
    <div style={{ 
      ...getStyles(),
      padding: '12px', 
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    }}>
      {getIcon()} {message}
    </div>
  );
};
