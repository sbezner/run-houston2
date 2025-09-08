import React from 'react';
import { useAuth } from "@shared/hooks/useAuth";
import { Loading } from "@shared/components/Loading";
import { Alert } from "@shared/components/Alert";
import { AdminClubsPage } from './AdminClubsPage';
import { AdminRacesPage } from './AdminRacesPage';
import { AdminRaceReportsPage } from './AdminRaceReportsPage';
import MonitoringPage from '../MonitoringPage';
import { useState, useEffect } from 'react';

export const AdminDashboard: React.FC = () => {
  const {
    isLoggedIn,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error: authError,
    tokenExpired,
    login,
    logout,
    handleTokenExpiration
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'races' | 'clubs' | 'race_reports' | 'monitoring'>('races');

  if (loading) {
    return <Loading />;
  }

  if (!isLoggedIn) {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          🔐 Admin Login
        </h2>
        
        {authError && <Alert message={authError} type="error" />}
        {tokenExpired && <Alert message="Your session has expired. Please login again." type="warning" />}
        
        <form onSubmit={(e) => {
          e.preventDefault();
          login(e);
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter username"
              required
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', color: '#111827' }}>
            🏃‍♂️ Run Houston Admin
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            Welcome back, <strong>{username}</strong>! Manage races and clubs.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          🚪 Logout
        </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0',
        marginBottom: '30px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('races')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'races' ? '#3b82f6' : 'transparent',
            color: activeTab === 'races' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'races' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'races' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'races') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'races') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          🏁 Races
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'clubs' ? '#3b82f6' : 'transparent',
            color: activeTab === 'clubs' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'clubs' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'clubs' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'clubs') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'clubs') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          🏃‍♂️ Clubs
        </button>
        <button
          onClick={() => setActiveTab('race_reports')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'race_reports' ? '#3b82f6' : 'transparent',
            color: activeTab === 'race_reports' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'race_reports' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'race_reports' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'race_reports') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'race_reports') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          📰 Race Reports
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'monitoring' ? '#3b82f6' : 'transparent',
            color: activeTab === 'monitoring' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'monitoring' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'monitoring' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'monitoring') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'monitoring') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          📊 Monitoring
        </button>
      </div>

      {/* Tab Content - Only render when logged in */}
      {isLoggedIn && (
        <div>
          {activeTab === 'races' && <AdminRacesPage onTokenExpiration={handleTokenExpiration} />}
          {activeTab === 'clubs' && <AdminClubsPage onTokenExpiration={handleTokenExpiration} />}
          {activeTab === 'race_reports' && <AdminRaceReportsPage onTokenExpiration={handleTokenExpiration} />}
          {activeTab === 'monitoring' && <MonitoringPage />}
        </div>
      )}
    </div>
  );
};
