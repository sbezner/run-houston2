import React, { useState, useEffect } from 'react';
import { raceReports } from '../../services/api';
import type { RaceReport, RaceReportsResponse } from '../../types';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';
import { auth } from '../../services/auth';
import { RaceReportForm } from '../../components/admin/RaceReportForm';
import { RaceReportsImportDialog } from '../../components/admin/RaceReportsImportDialog';
import { BulkBar } from './BulkBar';
import { BulkDeleteModal } from './BulkDeleteModal';

interface AdminRaceReportsPageProps {
  onTokenExpiration: () => void;
}

export const AdminRaceReportsPage: React.FC<AdminRaceReportsPageProps> = ({ onTokenExpiration }) => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RaceReport | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedReports, setSelectedReports] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<keyof RaceReport | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');



  // Sorting functions
  const handleSort = (field: keyof RaceReport) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortReports = (reportsToSort: RaceReport[]) => {
    if (!sortField) return reportsToSort;

    return [...reportsToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortableHeaderStyle = (field: keyof RaceReport) => ({
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'background-color 0.2s ease'
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      
      const response: RaceReportsResponse = await raceReports.list({
        limit,
        offset,
        include_race: true
      });
      setReports(response.items);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [offset]);



  const handleCreate = async (reportData: any) => {
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
      await raceReports.create(reportData, token);
      setShowCreateModal(false);
      fetchReports();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create report');
      }
    }
  };

  const handleEdit = async (reportData: any) => {
    if (!selectedReport) return;
    
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
      await raceReports.update(selectedReport.id, reportData, token);
      setShowEditModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update report');
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    
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
      await raceReports.remove(selectedReport.id, token);
      setShowDeleteModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete report');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;
    
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
      for (const reportId of selectedReports) {
        await raceReports.remove(reportId, token);
      }
      setSelectedReports(new Set());
      setShowBulkDeleteModal(false);
      fetchReports();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete selected reports');
      }
    }
  };

  const selectAllReports = () => {
    setSelectedReports(new Set(reports.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedReports(new Set());
  };

  const handleExport = async () => {
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
      const blob = await raceReports.exportCsv(token, {});
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'race_reports.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to export reports');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const checkAuthAndOpenEdit = (report: RaceReport) => {
    const token = auth.getToken();
    if (!token) {
      if (onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError('No authentication token');
      }
      return;
    }
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const checkAuthAndOpenDelete = (report: RaceReport) => {
    const token = auth.getToken();
    if (!token) {
      if (onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError('No authentication token');
      }
      return;
    }
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  if (loading && reports.length === 0) {
    return <Loading />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#111827' }}>
            📰 Race Reports Management
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Manage race reports, create content, and handle imports/exports.
          </p>
        </div>
        
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
               setShowImportDialog(true);
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
               handleExport();
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
             📤 Export CSV
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
               setShowCreateModal(true);
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
             ➕ Add Report
           </button>
        </div>
      </div>

      {error && (
        <Alert message={error} type="error" />
      )}

      

      {/* Bulk Operations Bar */}
      {selectedReports.size > 0 && (
        <BulkBar
          selectedCount={selectedReports.size}
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

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#374151' }}>
            No reports found
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            No reports. Click Add report to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Add Report
          </button>
        </div>
      ) : (
        <div>
          {/* Sort Status Indicator - REMOVED */}
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                               <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#374151', minWidth: 50 }}>
                      <input
                        type="checkbox"
                        checked={selectedReports.size === reports.length && reports.length > 0}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = selectedReports.size > 0 && selectedReports.size < reports.length;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllReports();
                          } else {
                            clearSelection();
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                    <th 
                      onClick={() => handleSort('id')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'id' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('id'),
                        backgroundColor: sortField === 'id' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      ID
                    </th>
                    <th 
                      onClick={() => handleSort('race_id')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'race_id' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('race_id'),
                        backgroundColor: sortField === 'race_id' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Race ID
                    </th>
                    <th 
                      onClick={() => handleSort('race_name')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'race_name' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('race_name'),
                        backgroundColor: sortField === 'race_name' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Race Name
                    </th>
                    <th 
                      onClick={() => handleSort('race_date')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'race_date' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('race_date'),
                        backgroundColor: sortField === 'race_date' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Race Date
                    </th>
                    <th 
                      onClick={() => handleSort('title')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'title' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('title'),
                        backgroundColor: sortField === 'title' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Title
                    </th>
                    <th 
                      onClick={() => handleSort('author_name')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'author_name' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('author_name'),
                        backgroundColor: sortField === 'author_name' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Author
                    </th>
                    <th 
                      onClick={() => handleSort('content_md')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'content_md' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('content_md'),
                        backgroundColor: sortField === 'content_md' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Content Preview
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Photos</th>
                    <th 
                      onClick={() => handleSort('created_at')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'created_at' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('created_at'),
                        backgroundColor: sortField === 'created_at' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Created
                    </th>
                    <th 
                      onClick={() => handleSort('updated_at')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortField === 'updated_at' ? '#f3f4f6' : 'transparent'}
                      style={{
                        ...getSortableHeaderStyle('updated_at'),
                        backgroundColor: sortField === 'updated_at' ? '#f3f4f6' : 'transparent'
                      }}
                    >
                      Updated
                    </th>
                  </tr>
                </thead>
               <tbody>
                 {sortReports(reports).map((report) => (
                    <tr key={report.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedReports.has(report.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReports(prev => new Set([...prev, report.id]));
                            } else {
                              setSelectedReports(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(report.id);
                                return newSet;
                              });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                                                     <button
                             onClick={() => checkAuthAndOpenEdit(report)}
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
                            onClick={() => checkAuthAndOpenDelete(report)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
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
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{report.id}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{report.race_id || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {report.race_name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {formatDate(report.race_date)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.title}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {report.author_name || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.content_md.replace(/[#*`]/g, '').substring(0, 100)}
                        {report.content_md.length > 100 ? '...' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.photos && report.photos.length > 0 ? (
                          <span title={report.photos.join(', ')}>
                            {report.photos.length} photo{report.photos.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          'No photos'
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(report.created_at)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(report.updated_at)}
                    </td>
                  </tr>
                 ))}
               </tbody>
             </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '15px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: offset === 0 ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                style={{
                  padding: '8px 16px',
                  backgroundColor: offset + limit >= total ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <RaceReportForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          mode="create"
        />
      )}

      {showEditModal && selectedReport && (
        <RaceReportForm
          report={selectedReport}
          onSubmit={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedReport(null);
          }}
          mode="edit"
        />
      )}

      {showDeleteModal && selectedReport && (
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
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>
              Delete Race Report
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280' }}>
              Are you sure you want to delete "{selectedReport.title}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedReport(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportDialog && (
        <RaceReportsImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={() => {
            setShowImportDialog(false);
            fetchReports();
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedReports.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}
    </div>
  );
};
