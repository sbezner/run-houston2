import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRaces } from '../../hooks/useRaces';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';
import { EditRaceModal } from './EditRaceModal';
import { DeleteRaceModal } from './DeleteRaceModal';
import { CreateRaceModal } from './CreateRaceModal';
import { BulkBar } from './BulkBar';
import { ImportPanel } from './ImportCsv/ImportPanel';
import { AdminClubsPage } from './AdminClubsPage';
import { useState } from 'react';
import { handleApiError } from '../../utils/apiErrorHandler';

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
    logout
  } = useAuth();

  const {
    races,
    racesLoading,
    error: racesError,
    setError,
    fetchAdminRaces,
    updateRace,
    deleteRace
  } = useRaces();

  const [editingRace, setEditingRace] = React.useState<any>(null);
  const [deletingRace, setDeletingRace] = React.useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRaces, setSelectedRaces] = React.useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'edit' | 'import' | 'clubs'>('edit');

  // Check if user is already logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      fetchAdminRaces();
    }
  }, [isLoggedIn, fetchAdminRaces]);





  const handleBulkDelete = React.useCallback(async () => {
    if (selectedRaces.size === 0) return;
    
    try {
      for (const raceId of selectedRaces) {
        await deleteRace(raceId);
      }
      setSelectedRaces(new Set());
    } catch (err: any) {
      const errorMessage = handleApiError(err, logout);
      setError(errorMessage);
    }
  }, [selectedRaces, deleteRace, setError, logout]);

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
            race.state || '',
            race.zip || '',
            race.latitude || '',
            race.longitude || '',
            `"${(race.geom || '').replace(/"/g, '""')}"`,
            race.surface || '',
            `"${(race.distance || []).join(', ')}"`,
            race.kid_run ? 'true' : 'false',
            `"${(race.official_website_url || '').replace(/"/g, '""')}"`,
            race.source || 'manual',
            race.created_at || '',
            race.updated_at || ''
          ];
          
          return row.join(',');
        })
      ].join('\n');

      // Add BOM to ensure proper CSV parsing in Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;
      
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
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

  // Local type and helper grid component
  type RaceRow = {
    id: number;
    name: string;
    date: string;
    start_time: string;
    tz: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    geom?: string | null;
    distance: unknown; // can be string[] or a Postgres array string
    surface: string;
    kid_run: boolean;
    official_website_url: string;
    source: string;
    created_at: string;
    updated_at: string;
  };

  // Normalize distance that might arrive as TEXT[], "{5K,10K}", or "5K,10K"
  const toStringArray = (val: unknown): string[] => {
    // Handle null/undefined values - use default value from database schema
    if (val === null || val === undefined) {
      return ['5K']; // Default value from database schema
    }
    
    if (Array.isArray(val)) {
      return (val as unknown[]).map(String).filter(Boolean);
    }
    
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return [];
      
      const body = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s;
      
      return body
        .split(',')
        .map(x => x.trim().replace(/^"(.*)"$/, '$1'))
        .filter(Boolean);
    }
    
    return ['5K']; // Fallback to default
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp; // Return original if invalid
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp; // Return original if parsing fails
    }
  };

  // Format geometry to short indicator
  const formatGeom = (geom: string | null | undefined, hasLocation: boolean = false): string => {
    if (!geom || geom.trim() === '') return '-';
    
    // Check if it's a Point geometry (most common for races)
    if (geom.includes('POINT')) return hasLocation ? '🗺️ Point' : '📍 Point';
    if (geom.includes('POLYGON')) return hasLocation ? '🗺️ Polygon' : '🔷 Polygon';
    if (geom.includes('LINESTRING')) return hasLocation ? '🗺️ Line' : '📏 Line';
    
    // Generic geometry indicator
    return hasLocation ? '🗺️ Geom' : '📍 Geom';
  };

  // Format URL to short display with tooltip
  const formatUrl = (url: string | null | undefined): string => {
    if (!url || url.trim() === '') return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // If URL parsing fails, return truncated version
      if (url.length > 30) {
        return url.substring(0, 30) + '...';
      }
      return url;
    }
  };

  const StickyRaceGrid: React.FC<{
    rows: RaceRow[];
    onEdit: (r: RaceRow) => void;
    onDelete: (r: RaceRow) => void;
  }> = ({ rows, onEdit, onDelete }) => {
    const cellPad = '8px 10px';
    const stickyW = 90;

    const thBase: React.CSSProperties = {
      position: 'sticky',
      top: 0,
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      textAlign: 'left',
      fontWeight: 600,
      padding: cellPad,
      zIndex: 3,
      whiteSpace: 'nowrap',
    };

    const tdBase: React.CSSProperties = {
      borderBottom: '1px solid #f1f5f9',
      padding: cellPad,
      verticalAlign: 'top',
    };



    return (
      <div style={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'separate', borderSpacing: 0, fontSize: 14, lineHeight: 1.3 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, left: 0, zIndex: 4, minWidth: stickyW, maxWidth: stickyW }}>Edit</th>
              <th style={{ ...thBase, left: stickyW, zIndex: 4, minWidth: stickyW, maxWidth: stickyW }}>Delete</th>
              <th style={thBase}>id</th>
              <th style={thBase}>name</th>
              <th style={thBase}>date</th>
              <th style={thBase}>start_time</th>
              <th style={thBase}>tz</th>
              <th style={thBase}>address</th>
              <th style={thBase}>city</th>
              <th style={thBase}>state</th>
              <th style={thBase}>zip</th>
              <th style={thBase}>latitude</th>
              <th style={thBase}>longitude</th>
              <th style={{...thBase, cursor: 'help'}} title="Click to open location in Google Maps">📍 GEOM</th>
              <th style={thBase}>distance</th>
              <th style={thBase}>surface</th>
              <th style={thBase}>kid_run</th>
              <th style={thBase}>official_website_url</th>
              <th style={thBase}>source</th>
              <th style={thBase}>created_at</th>
              <th style={thBase}>updated_at</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={21} style={{ ...tdBase, textAlign: 'center', color: '#64748b' }}>No races to display.</td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const bg = idx % 2 === 1 ? '#fcfcfd' : '#fff';
                const stickyTd = (left: number) => ({
                  ...tdBase,
                  position: 'sticky' as const,
                  left,
                  background: bg,
                  minWidth: stickyW,
                  maxWidth: stickyW,
                  whiteSpace: 'nowrap' as const,
                  zIndex: 2,
                });
                return (
                  <tr key={r.id} style={{ background: bg }}>
                    <td style={stickyTd(0)}>
                      <button 
                        onClick={() => onEdit(r)} 
                        style={{ 
                          background: 'none',
                          border: 'none',
                          color: '#007bff',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '14px',
                          textDecoration: 'underline'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                    <td style={stickyTd(stickyW)}>
                      <button 
                        onClick={() => onDelete(r)} 
                        style={{ 
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '14px',
                          textDecoration: 'underline'
                        }}
                      >
                        Delete
                      </button>
                    </td>

                    <td style={tdBase}>{r.id}</td>
                    <td style={tdBase}>{r.name}</td>
                    <td style={tdBase}>{r.date}</td>
                    <td style={tdBase}>{r.start_time}</td>
                    <td style={tdBase}>{r.tz || 'America/Chicago'}</td>
                    <td style={tdBase}>{r.address ?? ''}</td>
                    <td style={tdBase}>{r.city ?? ''}</td>
                    <td style={tdBase}>{r.state ?? ''}</td>
                    <td style={tdBase}>{r.zip ?? ''}</td>
                    <td style={tdBase}>{typeof r.latitude === 'number' ? r.latitude : ''}</td>
                    <td style={tdBase}>{typeof r.longitude === 'number' ? r.longitude : ''}</td>
                    <td style={tdBase}>
                      {(r.address || r.city || r.state || r.latitude) ? (
                        <a
                          href={(() => {
                            // Build Google Maps URL with address for better precision
                            let query = '';
                            
                            // If we have a full address, use that for best precision
                            if (r.address && r.city && r.state) {
                              query = `${r.address}, ${r.city}, ${r.state} ${r.zip || ''}`.trim();
                            }
                            // Fallback to city and state if no street address
                            else if (r.city && r.state) {
                              query = `${r.city}, ${r.state}`;
                            }
                            // Fallback to coordinates if no address
                            else if (r.latitude && r.longitude) {
                              query = `${r.latitude},${r.longitude}`;
                            }
                            
                            return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            color: '#007bff',
                            textDecoration: 'underline',
                            display: 'inline-block'
                          }}
                          title={(() => {
                            if (r.address && r.city && r.state) {
                              return `🗺️ Open "${r.address}, ${r.city}, ${r.state}" in Google Maps (Full Address)`;
                            } else if (r.city && r.state) {
                              return `🗺️ Open "${r.city}, ${r.state}" in Google Maps (City/State)`;
                            } else if (r.latitude && r.longitude) {
                              return `🗺️ Open coordinates (${r.latitude}, ${r.longitude}) in Google Maps`;
                            }
                            return '🗺️ Open location in Google Maps';
                          })()}
                        >
                          {formatGeom(r.geom, true)}
                        </a>
                      ) : (
                        <span style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          background: '#f9fafb',
                          color: '#9ca3af'
                        }}>
                          {formatGeom(r.geom, false)}
                        </span>
                      )}
                    </td>
                    <td style={tdBase}>
                      {(() => {
                        const result = toStringArray(r.distance);
                        if (result.length > 0) {
                          // Map abbreviated distances to full names for display
                          const distanceMap: Record<string, string> = {
                            '5K': '5K',
                            '10K': '10K',
                            'Half': 'Half Marathon',
                            'Half Marathon': 'Half Marathon',
                            'Marathon': 'Marathon',
                            'Ultra': 'Ultra',
                            'Other': 'Other'
                          };
                          
                          // Normalize distances first, then remove duplicates
                          const normalizedDistances = result.map(d => distanceMap[d] || d);
                          const uniqueDistances = [...new Set(normalizedDistances)];
                          
                          // Sort distances in logical order
                          const distanceOrder = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other'];
                          const sortedDistances = uniqueDistances.sort((a, b) => {
                            const aIndex = distanceOrder.indexOf(a);
                            const bIndex = distanceOrder.indexOf(b);
                            return aIndex - bIndex;
                          });
                          
                          return sortedDistances.join(', ');
                        }
                        // Fallback: show raw value if parsing failed
                        const raw = r.distance;
                        if (raw) {
                          return `[Raw: ${String(raw)}]`;
                        }
                        return '';
                      })()}
                    </td>
                    <td style={tdBase}>{r.surface}</td>
                    <td style={tdBase}><input type="checkbox" checked={!!r.kid_run} readOnly disabled /></td>
                    <td style={tdBase}>
                      {r.official_website_url ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <a 
                            href={r.official_website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              textDecoration: 'underline',
                              color: '#007bff',
                              cursor: 'pointer'
                            }}
                            title={r.official_website_url}
                          >
                            {formatUrl(r.official_website_url)}
                          </a>
                        </div>
                      ) : ''}
                    </td>
                    <td style={tdBase}>{r.source}</td>
                    <td style={tdBase}>{formatTimestamp(r.created_at)}</td>
                    <td style={tdBase}>{formatTimestamp(r.updated_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

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
        {tokenExpired && <Alert message="Your session has expired. Please log in again." type="warning" />}
        
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
    <div className="AdminPage" style={{ 
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '0', color: '#333' }}>🏃‍♂️ Admin Dashboard</h1>
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
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minWidth: '120px'
        }}>
          <span style={{ fontSize: '16px' }}>🏁</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{races.length}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Total Races</div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minWidth: '120px'
        }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{races.filter(r => new Date(r.date) > new Date()).length}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Upcoming</div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minWidth: '120px'
        }}>
          <span style={{ fontSize: '16px' }}>🏃</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{races.filter(r => r.surface === 'road').length}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Road Races</div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minWidth: '120px'
        }}>
          <span style={{ fontSize: '16px' }}>👶</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{races.filter(r => r.kid_run).length}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Kid-Friendly</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '30px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px 8px 0 0',
        padding: '4px 4px 0 4px'
      }}>
        <button
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'edit' ? '#3b82f6' : 'transparent',
            color: activeTab === 'edit' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'edit' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'edit' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'edit') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'edit') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          🏁 Edit Races
        </button>
        <button
          onClick={() => setActiveTab('import')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'import' ? '#3b82f6' : 'transparent',
            color: activeTab === 'import' ? 'white' : '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            borderBottom: activeTab === 'import' ? '2px solid #3b82f6' : 'none',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'import' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'import') {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'import') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          📊 Import
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
      </div>

      {/* Tab Content */}
      {activeTab === 'edit' && (
        <>
          {/* Create button above the grid */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '20px 0' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '8px', 
                border: 'none', 
                background: '#10b981', 
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
              }}
            >
              <span style={{ fontSize: '18px' }}>➕</span>
              Create New Race
            </button>
          </div>

          {/* Scrollable grid replacing cards */}
          {racesLoading ? (
            <Loading />
          ) : (
            <StickyRaceGrid
              rows={races as unknown as RaceRow[]}
              onEdit={(race) => setEditingRace(race)}
              onDelete={(race) => setDeletingRace(race)}
            />
          )}
        </>
      )}

      {activeTab === 'import' && (
        <>
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
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
        </>
      )}

      {activeTab === 'clubs' && (
        <AdminClubsPage />
      )}

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
    </div>
  );
};
