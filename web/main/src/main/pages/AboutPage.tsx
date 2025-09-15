import React, { useState, useEffect } from 'react';
import { config } from "@shared/config";

interface VersionInfo {
  api_version: string;
  api_path_major: string;
  web_version: string;
  mobile_version: string;
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
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>
            {versionInfo?.web_version || config.APP_VERSION}
          </div>
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
    padding: '0px 20px 20px 20px',
    boxSizing: 'border-box',
    margin: 0,
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw'
  }}>
    {/* Hero Section - App Download CTA */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '40px 40px 50px 40px', 
      borderRadius: '25px',
      textAlign: 'center',
      marginBottom: '60px'
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        marginBottom: '20px', 
        color: '#333',
        fontWeight: '700'
      }}>📱 Get the Run Houston App</h1>
      <p style={{ 
        fontSize: '22px', 
        color: '#666', 
        marginBottom: '40px',
        lineHeight: '1.5',
        maxWidth: '600px',
        margin: '0 auto 40px auto'
      }}>
        Download our mobile app for the best race discovery experience in the Greater Houston area
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '25px', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <button style={{ 
          backgroundColor: '#000', 
          color: 'white', 
          padding: '18px 30px', 
          border: 'none', 
          borderRadius: '15px', 
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          📱 iPhone Version
        </button>
        <button style={{ 
          backgroundColor: '#3DDC84', 
          color: 'white', 
          padding: '18px 30px', 
          border: 'none', 
          borderRadius: '15px', 
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(61,220,132,0.3)',
          transition: 'all 0.3s ease'
        }}>
          🤖 Android Version
        </button>
      </div>
    </div>

    {/* Mission Section */}
    <div style={{ 
      backgroundColor: 'white', 
      padding: '50px 40px', 
      borderRadius: '20px', 
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      textAlign: 'center',
      width: '100%',
      marginBottom: '60px'
    }}>
      <h2 style={{ fontSize: '36px', marginBottom: '25px', color: '#007AFF', fontWeight: '600' }}>Our Mission</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        lineHeight: '1.6', 
        marginBottom: '30px',
        maxWidth: '800px',
        margin: '0 auto 30px auto'
      }}>
        Run Houston connects runners with the best races and events in the Greater Houston area. 
        Whether you're a beginner or an experienced runner, we help you discover your next challenge.
      </p>
    </div>

    {/* Enhanced Features Section */}
    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '15px', 
        color: '#333',
        fontWeight: '700'
      }}>Why Choose Run Houston?</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '50px',
        lineHeight: '1.5',
        maxWidth: '600px',
        margin: '0 auto 50px auto'
      }}>
        We're your ultimate companion for discovering and planning your next running adventure in the Houston area.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'space-around',
        width: '100%'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Smart Race Discovery</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Find races that match your goals, schedule, and location preferences with our intelligent filtering system.
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Interactive Maps</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Visualize race locations, plan your route, and discover new running spots with our detailed mapping system.
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Mobile-First Design</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Optimized for runners on the go with a seamless mobile experience that works perfectly on any device.
          </p>
        </div>
      </div>
    </div>

    {/* Community Section */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '60px 40px', 
      borderRadius: '25px',
      textAlign: 'center',
      marginBottom: '60px'
    }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '20px', 
        color: '#333',
        fontWeight: '700'
      }}>Join the Houston Running Community</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '40px',
        maxWidth: '800px',
        margin: '0 auto 40px auto',
        lineHeight: '1.5'
      }}>
        Connect with fellow runners, share your achievements, and stay motivated with our growing community of Houston-area runners.
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏃‍♀️</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>500+</div>
          <div style={{ color: '#666' }}>Active Runners</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏁</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>150+</div>
          <div style={{ color: '#666' }}>Races Listed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>⭐</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>4.8/5</div>
          <div style={{ color: '#666' }}>User Rating</div>
        </div>
      </div>
    </div>

    {/* Technical Info Section */}
    <div style={{ 
      backgroundColor: 'white', 
      padding: '40px', 
      borderRadius: '15px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center',
      width: '100%'
    }}>
      <VersionDisplay />
    </div>
  </div>
);
