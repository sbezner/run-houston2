import React from 'react';
import type { Race } from '../types';
import { capitalizeSurface } from '../utils/formatting';

interface RaceCardProps {
  race: Race;
  onEdit?: (race: Race) => void;
  onDelete?: (race: Race) => void;
  isAdmin?: boolean;
}

export const RaceCard: React.FC<RaceCardProps> = ({ race, onEdit, onDelete, isAdmin = false }) => {
  const adminMetaRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '20px 1fr',
    columnGap: 8,
    alignItems: 'start',
    marginTop: 8,
  };

  const adminMetaTextStyle: React.CSSProperties = {
    minWidth: 0,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const adminAddressTextStyle: React.CSSProperties = {
    minWidth: 0,
    lineHeight: 1.25,
    whiteSpace: 'normal',
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
  };

  return (
    <div 
      style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}

    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>{race.name}</h3>
          
          {/* Date/Time Row */}
          <div style={{ 
            color: '#666',
            ...(isAdmin ? adminMetaRowStyle : {})
          }}>
            <span>📅</span>
            <span style={isAdmin ? adminMetaTextStyle : {}}>
              {race.date} {race.start_time && `at ${race.start_time}`}
            </span>
          </div>

          {/* Address Row */}
          {race.address && (
            <div style={{ 
              color: '#666',
              ...(isAdmin ? adminMetaRowStyle : {})
            }}>
              <span>📍</span>
              <span style={isAdmin ? adminAddressTextStyle : {}}>
                {race.address}, {race.city}, {race.state} {race.zip}
              </span>
            </div>
          )}

          {/* Surface Row */}
          <div style={{ 
            color: '#666',
            ...(isAdmin ? adminMetaRowStyle : {})
          }}>
            <span>🏃‍♂️</span>
            <span style={isAdmin ? adminMetaTextStyle : {}}>
              {capitalizeSurface(race.surface)}
            </span>
          </div>

          {/* Kid-friendly Row */}
          <div style={{ 
            color: '#666',
            ...(isAdmin ? adminMetaRowStyle : {})
          }}>
            <span>👶</span>
            <span style={isAdmin ? adminMetaTextStyle : {}}>
              Kid-friendly: {race.kid_run ? 'Yes' : 'No'}
            </span>
          </div>

                    {/* Website Row */}
          {race.official_website_url && (
            <div style={{ 
              color: '#666',
              ...(isAdmin ? adminMetaRowStyle : {})
            }}>
              <span>🌐</span>
              <span style={isAdmin ? adminMetaTextStyle : {}}>
                <a href={race.official_website_url} target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF' }}>
                  Official Website
                </a>
              </span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <div style={{ color: '#999', fontSize: '12px', fontWeight: '500' }}>
            ID: {race.id}
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {onEdit && (
                <button 
                  onClick={() => onEdit(race)}
                  style={{
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✏️ Edit
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(race)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
