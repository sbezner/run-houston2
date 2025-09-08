import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '1rem'
    }}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      />
      <p style={{ 
        color: '#6B7280', 
        fontSize: '0.875rem',
        margin: 0 
      }}>
        {message}
      </p>
    </div>
  );
};
