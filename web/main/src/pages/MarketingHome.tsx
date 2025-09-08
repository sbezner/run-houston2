import React from 'react';

export const MarketingHome: React.FC = () => (
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
    {/* Download Apps Section */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '0px 40px 10px 40px', 
      borderRadius: '25px',
      textAlign: 'center',
      marginBottom: '60px'
    }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '20px', 
        color: '#333',
        fontWeight: '700'
      }}>📱 Get the Run Houston App</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '40px',
        lineHeight: '1.5'
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
        lineHeight: '1.5'
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

    {/* New: Community Section */}
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
  </div>
);
