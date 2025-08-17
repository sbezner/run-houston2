import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRaces } from '../../hooks/useRaces';
import { StatCard } from '../../components/StatCard';
import { RaceCard } from '../../components/RaceCard';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';
import { EditRaceModal } from './EditRaceModal';
import { DeleteRaceModal } from './DeleteRaceModal';
import { CreateRaceModal } from './CreateRaceModal';
import { BulkBar } from './BulkBar';
import { ImportPanel } from './ImportCsv/ImportPanel';

export const AdminDashboard: React.FC = () => {
  const {
    isLoggedIn,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error: authError,
    login,
    logout
  } = useAuth();

  const {
    races,
    racesLoading,
    error: racesError,
    setError,
    fetchAdminRaces,
    createRace,
    updateRace,
    deleteRace
  } = useRaces();

  const [editingRace, setEditingRace] = React.useState<any>(null);
  const [deletingRace, setDeletingRace] = React.useState<any>(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [selectedRaces, setSelectedRaces] = React.useState<Set<number>>(new Set());

  // Check if user is already logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      fetchAdminRaces();
    }
  }, [isLoggedIn, fetchAdminRaces]);

  const handleEditRace = React.useCallback((race: any) => {
    setEditingRace(race);
  }, []);

  const handleDeleteRace = React.useCallback((race: any) => {
    setDeletingRace(race);
  }, []);

  const handleBulkDelete = React.useCallback(async () => {
    if (selectedRaces.size === 0) return;
    
    try {
      for (const raceId of selectedRaces) {
        await deleteRace(raceId);
      }
      setSelectedRaces(new Set());
    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedRaces, deleteRace, setError]);

  const selectAllRaces = React.useCallback(() => {
    setSelectedRaces(new Set(races.map(r => r.id)));
  }, [races]);

  const clearSelection = React.useCallback(() => {
    setSelectedRaces(new Set());
  }, []);

  const exportToCSV = React.useCallback(() => {
    if (races.length === 0) {
      setError('No races to export');
      return;
    }

    try {
      const headers = [
        'id', 'name', 'date', 'start_time', 'address', 'city', 'state', 'zip',
        'surface', 'kid_run', 'official_website_url', 'latitude', 'longitude'
      ];
      
      const csvContent = [
        headers.join(','),
        ...races.map(race => [
          race.id,
          `"${race.name.replace(/"/g, '""')}"`,
          race.date,
          race.start_time || '',
          `"${(race.address || '').replace(/"/g, '""')}"`,
          `"${(race.city || '').replace(/"/g, '""')}"`,
          race.state || '',
          race.zip || '',
          race.surface || '',
          race.kid_run ? 'true' : 'false',
          race.official_website_url || '',
          race.latitude || '',
          race.longitude || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'races.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to export CSV: ' + err.message);
    }
  }, [races, setError]);

  if (!isLoggedIn) {
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
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🔐 Admin Login</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Sign in to manage races</p>
        </div>
        
        {authError && <Alert message={authError} type="error" />}
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <form onSubmit={login}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Admin Dashboard</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Manage races and events</p>
        </div>
        <button
          onClick={logout}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🚪 Logout
        </button>
      </div>

      {racesError && <Alert message={racesError} type="error" />}

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard icon="🏁" value={races.length} label="Total Races" />
        <StatCard icon="📅" value={races.filter(r => new Date(r.date) > new Date()).length} label="Upcoming Races" />
        <StatCard icon="🏃" value={races.filter(r => r.surface === 'road').length} label="Road Races" />
        <StatCard icon="👶" value={races.filter(r => r.kid_run).length} label="Kid-Friendly" />
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Create Race
        </button>
        
        <button
          onClick={exportToCSV}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📊 Export CSV
        </button>
      </div>

      {/* CSV Import Panel */}
      <ImportPanel onImportComplete={fetchAdminRaces} />

      {/* Bulk Operations Bar */}
      {selectedRaces.size > 0 && (
        <BulkBar
          selectedCount={selectedRaces.size}
          onSelectAll={selectAllRaces}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Races List */}
      {racesLoading ? (
        <Loading />
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {races.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              isAdmin={true}
              onEdit={handleEditRace}
              onDelete={handleDeleteRace}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingRace && (
        <EditRaceModal
          race={editingRace}
          onSave={updateRace}
          onClose={() => setEditingRace(null)}
          onSuccess={() => {
            setEditingRace(null);
            fetchAdminRaces();
          }}
        />
      )}

      {deletingRace && (
        <DeleteRaceModal
          race={deletingRace}
          onDelete={deleteRace}
          onClose={() => setDeletingRace(null)}
          onSuccess={() => {
            setDeletingRace(null);
            fetchAdminRaces();
          }}
        />
      )}

      {showCreateForm && (
        <CreateRaceModal
          onSave={createRace}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchAdminRaces();
          }}
        />
      )}
    </div>
  );
};
