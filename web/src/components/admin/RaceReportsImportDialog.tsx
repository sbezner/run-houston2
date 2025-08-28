import React, { useState, useCallback } from 'react';
import { raceReports } from '../../services/api';
import { Alert } from '../../components/Alert';

interface RaceReportsImportDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportProgress {
  total: number;
  done: number;
  succeeded: number;
  failed: number;
  created: number;
  updated: number;
}

export const RaceReportsImportDialog: React.FC<RaceReportsImportDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const [importState, setImportState] = useState<'idle' | 'parsed' | 'validated' | 'committing' | 'done' | 'error'>('idle');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [commitProgress, setCommitProgress] = useState<ImportProgress>({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
  const [aborter, setAborter] = useState<AbortController | null>(null);

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setImportErrors(['File size must be less than 5MB']);
        setImportState('error');
        setCsvFile(null);
        return;
      }
      if (!selectedFile.name.endsWith('.csv')) {
        setImportErrors(['File must be a CSV']);
        setImportState('error');
        setCsvFile(null);
        return;
      }
      setCsvFile(selectedFile);
      setImportErrors([]);
      setImportState('idle');
    }
  }, []);

  const handleCSVParse = useCallback(async () => {
    if (!csvFile) return;

    try {
      setImportState('parsed');
      
      // Parse CSV content to preview
      const content = await csvFile.text();
      
      // Normalize line endings and handle quoted fields with newlines
      const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Parse CSV properly handling quoted fields
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < normalizedContent.length) {
        const char = normalizedContent[i];
        
        if (char === '"') {
          if (inQuotes && i + 1 < normalizedContent.length && normalizedContent[i + 1] === '"') {
            // Handle escaped quotes
            currentField += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // End of field
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          // End of row
          currentRow.push(currentField.trim());
          if (currentRow.length > 0) {
            rows.push([...currentRow]);
          }
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
        i++;
      }
      
      // Handle last field and row
      if (currentField.trim() || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
        }
      }
      
      // First row should be headers
      const headers = rows[0] || [];
      
      // Validate headers
      const expectedHeaders = ['id', 'race_id', 'race_name', 'race_date', 'title', 'author_name', 'content_md', 'photos'];
      if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
        setImportErrors([`Invalid CSV headers. Expected: ${expectedHeaders.join(', ')}, got: ${headers.join(', ')}`]);
        setImportState('error');
        return;
      }

      // Parse data rows for preview (skip header row)
      const dataRows = rows.slice(1).slice(0, 10); // Show first 10 rows
      console.log(`CSV Parse: Found ${rows.length} total rows (${rows.length - 1} data rows)`);
      
      const previewRows = dataRows.map((values) => {
        // Ensure we have enough values
        while (values.length < 8) {
          values.push('');
        }
        
        return {
          id: values[0] || 'New',
          race_id: values[1] || '',
          race_name: values[2] || '',
          race_date: values[3] || '',
          title: values[4] || '',
          author_name: values[5] || 'None',
          content_md: values[6] ? values[6].substring(0, 50) + '...' : 'None',
          photos: values[7] || 'None'
        };
      });

      setPreviewData(previewRows);
      setImportState('validated');
    } catch (error: any) {
      setImportErrors([`CSV parsing failed: ${error.message}`]);
      setImportState('error');
    }
  }, [csvFile]);

  const handleCSVCommit = useCallback(async () => {
    if (!csvFile) return;

    const controller = new AbortController();
    setAborter(controller);
    setImportState('committing');
    
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    try {
      // Get total rows for progress tracking using the same parsing logic as handleCSVParse
      const content = await csvFile.text();
      const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Parse CSV properly handling quoted fields (same logic as handleCSVParse)
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < normalizedContent.length) {
        const char = normalizedContent[i];
        
        if (char === '"') {
          if (inQuotes && i + 1 < normalizedContent.length && normalizedContent[i + 1] === '"') {
            // Handle escaped quotes
            currentField += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // End of field
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          // End of row
          currentRow.push(currentField.trim());
          if (currentRow.length > 0) {
            rows.push([...currentRow]);
          }
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
        i++;
      }
      
      // Handle last field and row
      if (currentField.trim() || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
        }
      }
      
      const totalRows = Math.max(0, rows.length - 1); // Exclude header
      console.log(`CSV Import: Parsed ${rows.length} total rows (${totalRows} data rows)`);
      setCommitProgress(prev => ({ ...prev, total: totalRows }));

      // Import the file
      const result = await raceReports.importCsv(csvFile, false, adminSecret);
      console.log('Import response:', result);
      
      // Check for validation errors in the response
      if (result.message && result.message.includes('Import validation failed')) {
        // Validation failed - show errors
        if (result.errors && Array.isArray(result.errors)) {
          setImportErrors(result.errors);
        } else {
          setImportErrors([result.message]);
        }
        setImportState('error');
        return;
      }
      
      // Parse the result message to extract counts
      if (result.message.includes('created') && result.message.includes('updated')) {
        const createdMatch = result.message.match(/(\d+) new reports created/);
        const updatedMatch = result.message.match(/(\d+) existing reports updated/);
        
        if (createdMatch) totalCreated = parseInt(createdMatch[1]);
        if (updatedMatch) totalUpdated = parseInt(updatedMatch[1]);
        
        totalSucceeded = totalCreated + totalUpdated;
      } else {
        totalSucceeded = totalRows;
      }

      setCommitProgress(prev => ({
        ...prev,
        done: totalRows,
        succeeded: totalSucceeded,
        failed: totalFailed,
        created: totalCreated,
        updated: totalUpdated
      }));

      if (!controller.signal.aborted) {
        setImportState('done');
        onSuccess();
      }
    } catch (error: any) {
      if (!controller.signal.aborted) {
        setImportErrors([`Import failed: ${error.message}`]);
        setImportState('error');
      }
    } finally {
      setAborter(null);
    }
  }, [csvFile, adminSecret, onSuccess]);

  const cancelImport = useCallback(() => {
    if (aborter) {
      aborter.abort();
      setAborter(null);
    }
    setImportState('idle');
  }, [aborter]);

  const resetImport = useCallback(() => {
    setImportState('idle');
    setPreviewData([]);
    setImportErrors([]);
    setCommitProgress({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
    setCsvFile(null);
    if (aborter) {
      aborter.abort();
      setAborter(null);
    }
  }, [aborter]);

  const downloadTemplate = () => {
    const csvContent = 'id,race_id,race_name,race_date,title,author_name,content_md,photos\n,1,Example Race,8/19/2025,Example Report,John Doe,## Test,https://example.com/photo1.jpg\n,,,2025-01-27,Orphaned Report,Jane Smith,## No Race,## Content without race association';
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

  const renderContent = () => {
    switch (importState) {
      case 'idle':
        return (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
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
                  fontSize: '14px',
                  marginBottom: '15px'
                }}
              >
                📋 Download Template
              </button>
            </div>



            {csvFile && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleCSVParse}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📊 Parse & Preview CSV
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
            )}
          </div>
        );

      case 'validated':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
              <p>Preview: {previewData.length} rows ready to import</p>
              
              {/* Preview valid rows */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#28a745' }}>✅ CSV Preview:</h4>
                
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #d4edda', 
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#f8fff9'
                }}>
                  {previewData.map((row, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px', 
                      padding: '8px', 
                      backgroundColor: 'white', 
                      border: '1px solid #d4edda',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${row.id === 'New' ? '#28a745' : '#ffc107'}`
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#155724', marginBottom: '3px' }}>
                        {row.id === 'New' ? `➕ New: ${row.title}` : `🔄 Update: ${row.title}`}
                      </div>
                      <div style={{ color: '#155724', fontSize: '12px' }}>
                        Race: {row.race_name} • Date: {row.race_date} • Author: {row.author_name}
                        {row.id !== 'New' && <span style={{ color: '#856404', marginLeft: '10px' }}>(ID: {row.id})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleCSVCommit}
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
                🚀 Commit Import
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

      case 'committing':
        return (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>🔄 Importing Race Reports...</h3>
              
              {/* Progress Bar */}
              <div style={{ 
                width: '100%', 
                backgroundColor: '#e9ecef', 
                borderRadius: '10px', 
                overflow: 'hidden',
                marginBottom: '15px'
              }}>
                <div style={{
                  width: `${(commitProgress.done / commitProgress.total) * 100}%`,
                  height: '20px',
                  backgroundColor: '#007AFF',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              {/* Progress Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666',
                marginTop: '5px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span>Progress: {commitProgress.done}/{commitProgress.total}</span>
                <span>Success: {commitProgress.succeeded}</span>
                {commitProgress.created > 0 && <span>Created: {commitProgress.created}</span>}
                {commitProgress.updated > 0 && <span>Updated: {commitProgress.updated}</span>}
                <span>Failed: {commitProgress.failed}</span>
              </div>
            </div>
            
            <button
              onClick={cancelImport}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel Import
            </button>
          </div>
        );

      case 'done':
        return (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Alert message="Import completed successfully!" type="success" />
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {commitProgress.created > 0 && commitProgress.updated > 0 ? (
                <>
                  Successfully processed {commitProgress.succeeded} race reports:
                  <br />
                  • {commitProgress.created} new reports created
                  <br />
                  • {commitProgress.updated} existing reports updated
                </>
              ) : commitProgress.updated > 0 ? (
                `Successfully updated ${commitProgress.updated} existing race reports`
              ) : (
                `Successfully created ${commitProgress.created} new race reports`
              )}
              {commitProgress.failed > 0 && (
                <>
                  <br />
                  ⚠️ {commitProgress.failed} reports failed to process
                </>
              )}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Alert message="Import failed" type="error" />
            
            {/* Display detailed errors */}
            {importErrors.length > 0 && (
              <div style={{ 
                marginBottom: '20px',
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid #fecaca', 
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#fef2f2'
              }}>
                <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#dc2626' }}>❌ Errors Found:</h4>
                {importErrors.map((error, index) => (
                  <div key={index} style={{ 
                    marginBottom: '8px', 
                    padding: '8px', 
                    backgroundColor: 'white', 
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    borderLeft: '4px solid #dc2626',
                    textAlign: 'left'
                  }}>
                    <div style={{ color: '#dc2626', fontSize: '14px' }}>
                      {error}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
                Try Again
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
        maxWidth: '800px',
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
