import React, { useState, useEffect } from 'react';
import { config } from '../config';

interface VersionInfo {
  api_version: string;
  api_path_major: string;
  schema_version: string;
  system_release: string;
}

const VersionDisplay: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`${config.API_BASE}${config.API_PATH}/version`);
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch version info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  return (
    <div style={{
      marginTop: '40px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#333', textAlign: 'center' }}>
        System Information
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>App Version</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>{config.APP_VERSION}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Build</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>{config.BUILD_HASH}</div>
        </div>
        {versionInfo && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>API Version</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>{versionInfo.api_version}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>System Release</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>{versionInfo.system_release}</div>
            </div>
          </>
        )}
        {loading && (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Loading version info...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => (
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
      <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>About Run Houston</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>Your guide to running in the Greater Houston area</p>
    </div>
    
    <div style={{ 
      backgroundColor: 'white', 
      padding: '40px', 
      borderRadius: '15px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center',
      width: '100%'
    }}>
      <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#007AFF' }}>Our Mission</h2>
      <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
        Run Houston connects runners with the best races and events in the Greater Houston area. 
        Whether you're a beginner or an experienced runner, we help you discover your next challenge.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'space-around',
        marginTop: '40px'
      }}>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Discovery</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Find new races and events in your area
          </p>
        </div>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🗺️</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Navigation</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Easy-to-use maps and directions
          </p>
        </div>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📱</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Mobile</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Optimized for runners on the go
          </p>
        </div>
      </div>
      
      <VersionDisplay />
    </div>
  </div>
);
