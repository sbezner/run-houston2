import React from 'react';

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
    </div>
  </div>
);
