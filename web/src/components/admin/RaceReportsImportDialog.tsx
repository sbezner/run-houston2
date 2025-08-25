import React, { useState } from 'react';
import { raceReports } from '../../services/api';

interface RaceReportsImportDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RaceReportsImportDialog: React.FC<RaceReportsImportDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setFile(null);
        return;
      }
      if (!selectedFile.name.endsWith('.csv')) {
        setError('File must be a CSV');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setDryRunResult(null);
    }
  };

  const handleDryRun = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const result = await raceReports.importCsv(file, true, adminSecret);
      setDryRunResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      await raceReports.importCsv(file, false, adminSecret);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'race_id,race_name,race_date,title,author_name,content_md,photos\n1,Example Race,2025-01-15,Example Report,John Doe,## Overview\nThis is an example report.,https://example.com/photo1.jpg';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'race_reports_template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827' }}>
            📥 Import Race Reports
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Upload a CSV file to import race reports. The file should have the required columns.
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>
                {error}
              </p>
            </div>
          )}

          {/* File Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Maximum file size: 5MB. Maximum rows: 2,000.
            </p>
          </div>

          {/* Dry Run Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Dry run mode (validate without importing)
              </span>
            </label>
          </div>

          {/* Template Download */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={downloadTemplate}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Download Template
            </button>
          </div>

          {/* CSV Format Info */}
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
              CSV Format Requirements:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
              <li><strong>race_id</strong>: Race ID (preferred) or leave empty to resolve by name+date</li>
              <li><strong>race_name</strong>: Race name (required if race_id is empty)</li>
              <li><strong>race_date</strong>: Race date in YYYY-MM-DD format (required if race_id is empty)</li>
              <li><strong>title</strong>: Report title (3-120 characters)</li>
              <li><strong>author_name</strong>: Author name (optional, 2-80 characters if provided)</li>
              <li><strong>content_md</strong>: Markdown content (10-20,000 characters)</li>
              <li><strong>photos</strong>: Semicolon-separated absolute URLs (optional)</li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            
            {dryRun && (
              <button
                type="button"
                onClick={handleDryRun}
                disabled={!file || loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !file || loading ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Validating...' : 'Validate CSV'}
              </button>
            )}
            
            {!dryRun && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || importing}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !file || importing ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !file || importing ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {importing ? 'Importing...' : 'Import Reports'}
              </button>
            )}
          </div>

          {/* Dry Run Results */}
          {dryRunResult && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0369a1' }}>
                Validation Results
              </h4>
              <div style={{ fontSize: '14px', color: '#0369a1' }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Message:</strong> {dryRunResult.message}
                </p>
                {dryRunResult.rows_to_process && (
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Rows to process:</strong> {dryRunResult.rows_to_process}
                  </p>
                )}
                {dryRunResult.errors && dryRunResult.errors.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Errors found:</strong>
                    </p>
                    <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
                      {dryRunResult.errors.slice(0, 10).map((error: string, index: number) => (
                        <li key={index} style={{ fontSize: '12px' }}>{error}</li>
                      ))}
                    </ul>
                    {dryRunResult.errors.length > 10 && (
                      <p style={{ margin: '0', fontSize: '12px' }}>
                        ... and {dryRunResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {(!dryRunResult.errors || dryRunResult.errors.length === 0) && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setDryRun(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Proceed with Import
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
