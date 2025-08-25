import React, { useState, useEffect } from 'react';
import { raceReports } from '../../services/api';
import { RaceReport, RaceReportsResponse } from '../../types';
import { Loading } from '../../components/Loading';
import { Alert } from '../../components/Alert';
import { RaceReportForm } from '../../components/admin/RaceReportForm';
import { RaceReportsImportDialog } from '../../components/admin/RaceReportsImportDialog';

export const AdminRaceReportsPage: React.FC = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RaceReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<'created_at' | 'race_date'>('created_at');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response: RaceReportsResponse = await raceReports.list({
        q: searchQuery || undefined,
        order_by: orderBy,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit,
        offset,
        include_race: true
      });
      setReports(response.items);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchQuery, orderBy, dateFrom, dateTo, offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchReports();
  };

  const handleReset = () => {
    setSearchQuery('');
    setOrderBy('created_at');
    setDateFrom('');
    setDateTo('');
    setOffset(0);
  };

  const handleCreate = async (reportData: any) => {
    try {
      await raceReports.create(reportData, adminSecret);
      setShowCreateModal(false);
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
    }
  };

  const handleEdit = async (reportData: any) => {
    if (!selectedReport) return;
    
    try {
      await raceReports.update(selectedReport.id, reportData, adminSecret);
      setShowEditModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    
    try {
      await raceReports.remove(selectedReport.id, adminSecret);
      setShowDeleteModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await raceReports.exportCsv({
        q: searchQuery || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      }, adminSecret);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'race_reports.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export reports');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            onClick={() => setShowImportDialog(true)}
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
            📥 Import CSV
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8b5cf6',
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
            ➕ Add Report
          </button>
        </div>
      </div>

      {error && (
        <Alert message={error} type="error" />
      )}

      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value as 'created_at' | 'race_date')}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="created_at">Newest First</option>
              <option value="race_date">Race Date</option>
            </select>
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

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
            {searchQuery || dateFrom || dateTo ? 'Try adjusting your search criteria.' : 'No reports. Click Add report to get started.'}
          </p>
          {!searchQuery && !dateFrom && !dateTo && (
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
          )}
        </div>
      ) : (
        <div>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Race Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Race Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Author</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Updated</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{report.id}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {report.race?.name || `Race ${report.race_id}`}
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
                      {formatDate(report.created_at)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(report.updated_at)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowEditModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f59e0b',
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
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDeleteModal(true);
                          }}
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
    </div>
  );
};
