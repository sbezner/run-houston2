import React, { useState, useEffect } from 'react';
import { clubs } from "@shared/services/api";
import type { Club } from "@shared/types";
import { Loading } from "@shared/components/Loading";
import { Alert } from "@shared/components/Alert";

export const ClubsPage: React.FC = () => {
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await clubs.list();
        setClubsList(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  return (
    <div style={{ 
      width: '100%',
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box',
      margin: 0
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Running Clubs</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>Discover local running clubs and organizations</p>
      </div>

      {clubsList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>No clubs found.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {clubsList.map((club) => (
            <div
              key={club.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
              }}
            >
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#1f2937',
                lineHeight: '1.3'
              }}>
                {club.club_name}
              </h3>
              
              {club.location && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  color: '#6b7280'
                }}>
                  <span style={{ marginRight: '8px' }}>📍</span>
                  <span>{club.location}</span>
                </div>
              )}
              
              {club.description && (
                <div style={{ 
                  marginBottom: '16px',
                  color: '#4b5563',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {club.description}
                </div>
              )}
              
              {club.website_url && (
                <a
                  href={club.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '10px 16px',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056CC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007AFF';
                  }}
                >
                  <span style={{ marginRight: '6px' }}>🌐</span>
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
