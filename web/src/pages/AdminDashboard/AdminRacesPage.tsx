import React, { useState, useEffect } from 'react';
import { useRaces } from '../../hooks/useRaces';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';
import { EditRaceModal } from './EditRaceModal';
import { DeleteRaceModal } from './DeleteRaceModal';
import { CreateRaceModal } from './CreateRaceModal';
import { BulkBar } from './BulkBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { ImportRacesModal } from './ImportRacesModal';
import { handleApiError } from '../../utils/apiErrorHandler';
import { auth } from '../../services/auth';
import type { Race } from '../../types';

interface AdminRacesPageProps {
  onTokenExpiration: () => void;
}

export const AdminRacesPage: React.FC<AdminRacesPageProps> = ({ onTokenExpiration }) => {
  const {
    races,
    racesLoading,
    error,
    setError,
    fetchAdminRaces,
    updateRace,
    deleteRace
  } = useRaces(onTokenExpiration);

  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [deletingRace, setDeletingRace] = useState<Race | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRaces, setSelectedRaces] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    fetchAdminRaces();
  }, [fetchAdminRaces]);

  const handleBulkDelete = async () => {
    if (selectedRaces.size === 0) return;
    
    try {
      for (const raceId of selectedRaces) {
        await deleteRace(raceId);
      }
      setSelectedRaces(new Set());
      setShowBulkDeleteModal(false);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const selectAllRaces = () => {
    setSelectedRaces(new Set(races.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedRaces(new Set());
  };

  const checkAuthAndOpenEdit = (race: Race) => {
    const token = auth.getToken();
    if (!token) {
      if (onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError('No authentication token');
      }
      return;
    }
    setEditingRace(race);
  };

  const checkAuthAndOpenDelete = (race: Race) => {
    const token = auth.getToken();
    if (!token) {
      if (onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError('No authentication token');
      }
      return;
    }
    setDeletingRace(race);
  };

  const exportToCSV = () => {
    if (races.length === 0) {
      setError('No races to export');
      return;
    }

    try {
      const headers = [
        'id', 'name', 'date', 'start_time', 'tz', 'address', 'city', 'state', 'zip',
        'latitude', 'longitude', 'geom', 'surface', 'distance', 'kid_run', 
        'official_website_url', 'source', 'created_at', 'updated_at'
      ];
      
      const csvContent = [
        headers.join(','),
        ...races.map((race) => {
          const row = [
            race.id,
            `"${(race.name || '').replace(/"/g, '""')}"`,
            race.date || '',
            race.start_time || '',
            race.tz || 'America/Chicago',
            `"${(race.address || '').replace(/"/g, '""')}"`,
            `"${(race.city || '').replace(/"/g, '""')}"`,
            `"${(race.state || '').replace(/"/g, '""')}"`,
            race.zip || '',
            race.latitude || '',
            race.longitude || '',
            `"${(race.geom || '').replace(/"/g, '""')}"`,
            `"${(race.surface || '').replace(/"/g, '""')}"`,
            `"${(Array.isArray(race.distance) ? race.distance.join(', ') : race.distance || '').replace(/"/g, '""')}"`,
            race.kid_run ? 'true' : 'false',
            `"${(race.official_website_url || '').replace(/"/g, '""')}"`,
            `"${(race.source || '').replace(/"/g, '""')}"`,
            race.created_at || '',
            race.updated_at || ''
          ];
          return row.join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `races-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  if (racesLoading) {
    return <Loading />;
  }

  return (
    <div>
      {error && <Alert message={error} type="error" />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', margin: 0, color: '#333' }}>🏁 Manage Races</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              const token = auth.getToken();
              if (!token) {
                if (onTokenExpiration) {
                  onTokenExpiration();
                } else {
                  setError('No authentication token');
                }
                return;
              }
              setShowCreateForm(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ Add Race
          </button>
          <button
            onClick={() => {
              const token = auth.getToken();
              if (!token) {
                if (onTokenExpiration) {
                  onTokenExpiration();
                } else {
                  setError('No authentication token');
                }
                return;
              }
              setShowImportModal(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📥 Import CSV
          </button>
          <button
            onClick={() => {
              const token = auth.getToken();
              if (!token) {
                if (onTokenExpiration) {
                  onTokenExpiration();
                } else {
                  setError('No authentication token');
                }
                return;
              }
              exportToCSV();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 Export CSV
          </button>
        </div>
      </div>



      {/* Bulk Operations Bar */}
      {selectedRaces.size > 0 && (
        <BulkBar
          selectedCount={selectedRaces.size}
          onClearSelection={clearSelection}
          onBulkDelete={() => {
            const token = auth.getToken();
            if (!token) {
              if (onTokenExpiration) {
                onTokenExpiration();
              } else {
                setError('No authentication token');
              }
              return;
            }
            setShowBulkDeleteModal(true);
          }}
        />
      )}

      {/* Races Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e9ecef', minWidth: 50 }}>
                  <input
                    type="checkbox"
                    checked={selectedRaces.size === races.length && races.length > 0}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedRaces.size > 0 && selectedRaces.size < races.length;
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllRaces();
                      } else {
                        clearSelection();
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 60 }}>Actions</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 60 }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 200 }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 120 }}>Address</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>City</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 80 }}>State</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 80 }}>ZIP</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>Distance</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>Surface</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 80 }}>Kid Run</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 120 }}>Website</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 100 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {races.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No races to display.
                  </td>
                </tr>
              ) : (
                races.map((race, idx) => (
                  <tr key={race.id} style={{ 
                    backgroundColor: idx % 2 === 1 ? '#fcfcfd' : '#fff',
                    borderBottom: '1px solid #f1f3f4'
                  }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedRaces.has(race.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRaces(prev => new Set([...prev, race.id]));
                          } else {
                            setSelectedRaces(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(race.id);
                              return newSet;
                            });
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => checkAuthAndOpenEdit(race)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => checkAuthAndOpenDelete(race)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{race.id}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{race.name}</td>
                    <td style={{ padding: '12px' }}>{race.date}</td>
                    <td style={{ padding: '12px' }}>{race.start_time}</td>
                    <td style={{ padding: '12px' }}>{race.address || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.city || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.state || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.zip || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.distance || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.surface || '-'}</td>
                    <td style={{ padding: '12px' }}>{race.kid_run ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '12px' }}>
                      {race.official_website_url ? (
                        <button
                          onClick={() => {
                            const token = auth.getToken();
                            if (!token) {
                              if (onTokenExpiration) {
                                onTokenExpiration();
                              } else {
                                setError('No authentication token');
                              }
                              return;
                            }
                            window.open(race.official_website_url, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ 
                            color: '#007AFF', 
                            textDecoration: 'none',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🌐 Visit
                        </button>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>{race.source || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editingRace && (
        <EditRaceModal
          race={editingRace}
          onSave={(raceData) => updateRace(editingRace.id, raceData)}
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
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchAdminRaces();
          }}
        />
      )}

      {showImportModal && (
        <ImportRacesModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            fetchAdminRaces();
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedRaces.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}
    </div>
  );
};
