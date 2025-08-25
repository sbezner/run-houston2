import React, { useState, useEffect } from 'react';
import { clubs } from '../../services/api';
import { auth } from '../../services/auth';
import type { Club } from '../../types';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';

export const AdminClubsPage: React.FC = () => {
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchClubs = async () => {
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');
      
      const data = await clubs.adminList(token);
      setClubsList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clubs');
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
      if (!token) throw new Error('No authentication token');
      
      await clubs.create(clubData, token);
      setShowCreateForm(false);
      fetchClubs();
    } catch (err: any) {
      setError(err.message || 'Failed to create club');
    }
  };

  const handleUpdateClub = async (clubData: Partial<Club>) => {
    if (!editingClub) return;
    
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');
      
      await clubs.update(editingClub.id, clubData, token);
      setEditingClub(null);
      fetchClubs();
    } catch (err: any) {
      setError(err.message || 'Failed to update club');
    }
  };

  const handleDeleteClub = async (clubId: number) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');
      
      await clubs.remove(clubId, token);
      fetchClubs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete club');
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');
      
      await clubs.exportCsv(token);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');
      
      await clubs.importCsv(file, token);
      setError(null);
      fetchClubs(); // Refresh the list
      alert('CSV imported successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    }
    
    // Reset the file input
    event.target.value = '';
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
            onClick={() => setShowCreateForm(true)}
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
          <label
            style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-block'
            }}
          >
            📥 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleExportCsv}
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

      {/* Clubs Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Club Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Location</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Website</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubsList.map((club) => (
              <tr key={club.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={{ padding: '12px' }}>{club.id}</td>
                <td style={{ padding: '12px', fontWeight: '500' }}>{club.club_name}</td>
                <td style={{ padding: '12px' }}>{club.location || '-'}</td>
                <td style={{ padding: '12px' }}>
                  {club.website_url ? (
                    <a 
                      href={club.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#007AFF', textDecoration: 'none' }}
                    >
                      🌐 Visit
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditingClub(club)}
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
                      onClick={() => handleDeleteClub(club.id)}
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
              </tr>
            ))}
          </tbody>
        </table>
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
    website_url: club?.website_url || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.club_name.trim()) {
      alert('Club name is required');
      return;
    }
    onSubmit(formData);
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
      
      <div style={{ marginBottom: '20px' }}>
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
