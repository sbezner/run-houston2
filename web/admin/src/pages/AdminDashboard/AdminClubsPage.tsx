import React, { useState, useEffect } from 'react';
import { clubs } from "@shared/services/api";
import { auth } from "@shared/services/auth";
import type { Club } from "@shared/types";
import { Loading } from "@shared/components/Loading";
import { Alert } from "@shared/components/Alert";
import { BulkBar } from './BulkBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { ImportClubsModal } from './ImportClubsModal';

interface AdminClubsPageProps {
  onTokenExpiration: () => void;
}

export const AdminClubsPage: React.FC<AdminClubsPageProps> = ({ onTokenExpiration }) => {
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClubs, setSelectedClubs] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const fetchClubs = async () => {
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      const data = await clubs.adminList(token);
      setClubsList(data);
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message || 'Failed to fetch clubs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (clubData: Partial<Club>) => {
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      await clubs.create(clubData, token);
      setShowCreateForm(false);
      fetchClubs();
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message || 'Failed to create club');
      }
    }
  };

  const handleUpdateClub = async (clubData: Partial<Club>) => {
    if (!editingClub) return;
    
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      await clubs.update(editingClub.id, clubData, token);
      setEditingClub(null);
      fetchClubs();
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message || 'Failed to update club');
      }
    }
  };

  const handleDeleteClub = async (clubId: number) => {
    if (!confirm('Are you sure you want to delete this club?')) {
      return;
    }
    
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      await clubs.delete(clubId, token);
      fetchClubs();
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message || 'Failed to delete club');
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      const blob = await clubs.exportCsv(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clubs.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message || 'Failed to export CSV');
      }
    }
  };


  const handleBulkDelete = async () => {
    if (selectedClubs.size === 0) return;
    
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      for (const clubId of selectedClubs) {
        await clubs.delete(clubId, token);
      }
      setSelectedClubs(new Set());
      setShowBulkDeleteModal(false);
      fetchClubs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete selected clubs');
    }
  };

  const selectAllClubs = () => {
    setSelectedClubs(new Set(clubsList.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedClubs(new Set());
  };

  const checkAuthAndOpenEdit = (club: Club) => {
    const token = auth.getToken();
    if (!token) {
      if (onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError('No authentication token');
      }
      return;
    }
    setEditingClub(club);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {error && <Alert message={error} type="error" />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', margin: 0, color: '#333' }}>🏃‍♂️ Manage Clubs</h2>
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
            ➕ Add Club
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
              handleExportCsv();
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
      {selectedClubs.size > 0 && (
        <BulkBar
          selectedCount={selectedClubs.size}
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

      {/* Clubs Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
              <tr>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e9ecef', minWidth: 50 }}>
                <input
                  type="checkbox"
                  checked={selectedClubs.size === clubsList.length && clubsList.length > 0}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = selectedClubs.size > 0 && selectedClubs.size < clubsList.length;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllClubs();
                    } else {
                      clearSelection();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 60 }}>Actions</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 60 }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 200 }}>Club Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 150 }}>Location</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 200 }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', minWidth: 120 }}>Website</th>
            </tr>
          </thead>
          <tbody>
            {clubsList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  No clubs to display.
                </td>
              </tr>
            ) : (
              clubsList.map((club, idx) => (
                <tr key={club.id} style={{ 
                  backgroundColor: idx % 2 === 1 ? '#fcfcfd' : '#fff',
                  borderBottom: '1px solid #f1f3f4'
                }}>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedClubs.has(club.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClubs(prev => new Set([...prev, club.id]));
                      } else {
                        setSelectedClubs(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(club.id);
                          return newSet;
                        });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => checkAuthAndOpenEdit(club)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
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
                        handleDeleteClub(club.id);
                      }}
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
                      🗑️ Delete
                    </button>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{club.id}</td>
                <td style={{ padding: '12px', fontWeight: '500' }}>{club.club_name}</td>
                <td style={{ padding: '12px' }}>{club.location || '-'}</td>
                <td style={{ padding: '12px', maxWidth: '200px', wordWrap: 'break-word' }}>
                  {club.description ? (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#4b5563',
                      lineHeight: '1.4',
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {club.description}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                   {club.website_url ? (
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
                         window.open(club.website_url, '_blank', 'noopener,noreferrer');
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
                   ) : (
                     '-'
                   )}
                 </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateForm || editingClub) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              {editingClub ? 'Edit Club' : 'Create New Club'}
            </h3>
            
            <ClubForm
              club={editingClub}
              onSubmit={editingClub ? handleUpdateClub : handleCreateClub}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingClub(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedClubs.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportClubsModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            fetchClubs();
          }}
        />
      )}
    </div>
  );
};

// Club Form Component
interface ClubFormProps {
  club?: Club | null;
  onSubmit: (data: Partial<Club>) => void;
  onCancel: () => void;
}

const ClubForm: React.FC<ClubFormProps> = ({ club, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    club_name: club?.club_name || '',
    location: club?.location || '',
    website_url: club?.website_url || '',
    description: club?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.club_name.trim()) {
      alert('Club name is required');
      return;
    }
    const payload = {
      club_name: formData.club_name.trim(),
      location: formData.location.trim() ? formData.location.trim() : null,
      website_url: formData.website_url.trim() ? formData.website_url.trim() : null,
      description: formData.description.trim() ? formData.description.trim() : null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Club Name *
        </label>
        <input
          type="text"
          value={formData.club_name}
          onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          required
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Website URL
        </label>
        <input
          type="url"
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          placeholder="https://example.com"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the club's activities, focus, and community..."
          rows={3}
          maxLength={500}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          textAlign: 'right', 
          marginTop: '4px' 
        }}>
          {formData.description.length}/500 characters
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {club ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
