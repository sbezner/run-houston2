import React from 'react';

import { useRaces } from '../hooks/useRaces';
import { capitalizeSurface } from '../utils/formatting';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';

export const RacesPage: React.FC = () => {
  const { races, racesLoading, error, fetchPublicRaces } = useRaces();

  React.useEffect(() => {
    fetchPublicRaces();
  }, [fetchPublicRaces]);

  if (racesLoading) {
    return (
      <div style={{ 
        width: '100vw', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
        margin: 0,
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading races...</p>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Error loading races</p>
        </div>
        <Alert message={error} type="error" />
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={fetchPublicRaces}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          {races.length > 0 ? `Found ${races.length} races in the Greater Houston area` : 'No races found'}
        </p>
      </div>
      
      {races.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#007AFF' }}>No Races Available</h2>
          <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
            Check back soon for upcoming races in the Houston area!
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          width: '100%'
        }}>
          {races.map((race) => (
            <div key={race.id} style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                fontSize: '22px', 
                marginBottom: '15px', 
                color: '#333',
                fontWeight: '600'
              }}>{race.name}</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px',
                  color: '#666'
                }}>
                  <span>📅</span>
                  <span>{new Date(race.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                {race.start_time && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>⏰</span>
                    <span>{race.start_time}</span>
                  </div>
                )}
                
                {(race.city || race.state) && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>📍</span>
                    <span>{[race.city, race.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {race.surface && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>🏃</span>
                    <span>{capitalizeSurface(race.surface)} Surface</span>
                  </div>
                )}
                
                {race.kid_run && (
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666',
                    fontWeight: '400'
                  }}>
                    <span>👶</span>
                    <span>Kid Run: Yes</span>
                  </div>
                )}
              </div>
              
              {race.official_website_url && (
                <a 
                  href={race.official_website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Visit Website
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
