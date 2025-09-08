import React, { useState, useCallback } from 'react';
import { raceReports } from '@shared/services/api';
import { auth } from '@shared/services/auth';
import { Alert } from '@shared/components/Alert';

interface RaceReportsImportDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RaceReportsImportDialog: React.FC<RaceReportsImportDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const [importState, setImportState] = useState<'idle' | 'validating' | 'validated' | 'importing' | 'done' | 'error'>('idle');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importProgress, setImportProgress] = useState({ total: 0, done: 0, succeeded: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setImportState('error');
        setCsvFile(null);
        return;
      }
      
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('File must be a CSV');
        setImportState('error');
        setCsvFile(null);
        return;
      }
      
      setCsvFile(file);
      setError(null);
      setImportState('idle');
    }
  }, []);

  const handleValidate = useCallback(async () => {
    if (!csvFile) return;

    setImportState('validating');
    setError(null);

    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const result = await raceReports.importCsv(csvFile, token, true); // dry run
      setValidationResult(result);
      setImportState('validated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      setImportState('error');
    }
  }, [csvFile]);

  const handleImport = useCallback(async () => {
    if (!csvFile) return;

    setImportState('importing');
    setError(null);

    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const result = await raceReports.importCsv(csvFile, token, false); // real import
      setImportProgress({ total: result.total || 0, done: result.total || 0, succeeded: result.succeeded || 0, failed: result.failed || 0 });
      setImportState('done');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportState('error');
    }
  }, [csvFile, onSuccess]);

  const resetImport = useCallback(() => {
    setImportState('idle');
    setCsvFile(null);
    setValidationResult(null);
    setImportProgress({ total: 0, done: 0, succeeded: 0, failed: 0 });
    setError(null);
  }, []);

  const downloadTemplate = () => {
    const csvContent = 'id,race_id,race_name,race_date,title,author_name,content_md,photos\n,1,Example Race,2025-01-15,Example Report,John Doe,"# Example Report\n\nThis is an example race report.",https://example.com/photo1.jpg';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'race_reports_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    const baseStyle = {
      opacity: 1,
      transition: 'opacity 0.2s ease-in-out',
      minHeight: '200px'
    };

    switch (importState) {
      case 'idle':
        return (
          <div style={baseStyle}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>
                Download Template:
              </h4>
              <button
                onClick={downloadTemplate}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              >
                📥 Download Template
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>
                Select CSV File:
              </h4>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ 
                  marginBottom: '12px',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                <p>• File must be a CSV</p>
                <p>• Maximum file size: 5MB</p>
              </div>
            </div>
            
            {csvFile && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                  Selected file: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  onClick={handleValidate}
                  style={{
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Validate CSV
                </button>
              </div>
            )}
          </div>
        );

      case 'validating':
        return (
          <div style={baseStyle}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', color: '#374151', marginBottom: '10px' }}>
                Validating CSV file...
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Please wait while we validate your file.
              </div>
            </div>
          </div>
        );

      case 'validated':
        return (
          <div style={baseStyle}>
            <div style={{ marginBottom: '15px' }}>
              <Alert message="CSV validation successful! Ready to import." type="success" />
              
              {validationResult && (
                <div style={{ 
                  marginTop: '15px',
                  padding: '15px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '6px',
                  border: '1px solid #bae6fd'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0369a1' }}>
                    Validation Results:
                  </h4>
                  <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', color: '#0369a1' }}>
                    {JSON.stringify(validationResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleImport}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Import Race Reports
              </button>
              <button
                onClick={resetImport}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Re-Select File
              </button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div style={baseStyle}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                width: '100%', 
                backgroundColor: '#e9ecef', 
                borderRadius: '10px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  width: `${importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}%`,
                  height: '20px',
                  backgroundColor: '#007AFF',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666',
                marginTop: '5px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span>Progress: {importProgress.done}/{importProgress.total}</span>
                <span>Success: {importProgress.succeeded}</span>
                <span>Failed: {importProgress.failed}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', color: '#374151' }}>
              Importing race reports...
            </div>
          </div>
        );

      case 'done':
        return (
          <div style={baseStyle}>
            <Alert message="Import completed successfully!" type="success" />
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Successfully processed {importProgress.succeeded} race reports.
              {importProgress.failed > 0 && (
                <>
                  <br />
                  ⚠️ {importProgress.failed} reports failed to process
                </>
              )}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={resetImport}
                style={{
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📤 Import Another File
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✅ Done
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div style={baseStyle}>
            <Alert message={error || 'An error occurred during validation'} type="error" />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={resetImport}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Re-Select File
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '24px', margin: 0, color: '#333' }}>
            📤 Import Race Reports from CSV
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};
