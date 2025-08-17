import React from 'react';

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({ icon, value, label }) => (
  <div style={{ 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '15px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>{value}</div>
    <div style={{ color: '#666' }}>{label}</div>
  </div>
));
