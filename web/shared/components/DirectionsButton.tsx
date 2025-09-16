import React from 'react';
import { 
  getGoogleMapsDirectionsUrl, 
  hasValidAddress, 
  getDirectionsButtonText,
  getDirectionsTooltip,
  getAddressConfidence,
  type RaceLocation 
} from '../utils/directions';

interface DirectionsButtonProps {
  race: RaceLocation;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DirectionsButton: React.FC<DirectionsButtonProps> = ({
  race,
  variant = 'primary',
  size = 'md',
  showIcon = true,
  className = '',
  style = {}
}) => {
  const handleDirectionsClick = () => {
    if (!hasValidAddress(race)) {
      // Fallback: Open Google Maps with Houston as default
      window.open('https://www.google.com/maps/dir/?api=1&destination=Houston,+TX', '_blank');
      return;
    }

    const directionsUrl = getGoogleMapsDirectionsUrl(race);
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
  };

  // Don't render if no valid address
  if (!hasValidAddress(race)) {
    return null;
  }

  const confidence = getAddressConfidence(race);
  const buttonText = getDirectionsButtonText(race);
  const tooltip = getDirectionsTooltip(race);

  // Base styles
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    ...style
  };

  // Size styles
  const sizeStyles = {
    sm: {
      fontSize: '12px',
      padding: '6px 12px',
      gap: '4px'
    },
    md: {
      fontSize: '14px',
      padding: '8px 16px',
      gap: '6px'
    },
    lg: {
      fontSize: '16px',
      padding: '12px 20px',
      gap: '8px'
    }
  };

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: '#10b981',
      color: '#ffffff',
      border: '1px solid #059669',
      ':hover': {
        backgroundColor: '#059669',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      ':hover': {
        backgroundColor: '#e5e7eb',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    },
    minimal: {
      backgroundColor: 'transparent',
      color: '#10b981',
      border: '1px solid #10b981',
      ':hover': {
        backgroundColor: '#10b981',
        color: '#ffffff'
      }
    }
  };

  // Confidence indicator styles
  const confidenceIndicator = {
    high: '🎯', // Precise target
    medium: '📍', // Map pin
    low: '🔍' // Search
  };

  const finalStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant]
  };

  return (
    <button
      onClick={handleDirectionsClick}
      title={tooltip}
      className={`directions-button ${className}`}
      style={finalStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      }}
    >
      {showIcon && (
        <span style={{ fontSize: '16px' }}>
          {confidenceIndicator[confidence]}
        </span>
      )}
      <span>{buttonText}</span>
    </button>
  );
};

export default DirectionsButton;
