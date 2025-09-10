import React, { useState, useCallback } from 'react';
import { raceReports } from '@shared/services/api';
import { auth } from '@shared/services/auth';
import { Alert } from '@shared/components/Alert';
import { parseCsvFile } from './RaceReportsImport/parseCsv';
import { validateAndTransform } from './RaceReportsImport/validation';
import type { RaceReportUpsert, ImportError } from './RaceReportsImport/errors';

interface RaceReportsImportDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RaceReportsImportDialog: React.FC<RaceReportsImportDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const [importState, setImportState] = useState<'idle' | 'parsed' | 'validated' | 'importing' | 'done' | 'error'>('idle');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [allValidRows, setAllValidRows] = useState<RaceReportUpsert[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importWarnings, setImportWarnings] = useState<ImportError[]>([]);
  const [willUpdate, setWillUpdate] = useState<RaceReportUpsert[]>([]);
  const [willCreate, setWillCreate] = useState<RaceReportUpsert[]>([]);
  const [willSkip, setWillSkip] = useState<RaceReportUpsert[]>([]);
  const [importProgress, setImportProgress] = useState({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
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

  const handleParse = useCallback(async () => {
    if (!csvFile) return;

    try {
      setImportState('parsed');
      const result = await parseCsvFile(csvFile);
      
      if (result.headerErrors.length > 0) {
        setImportErrors(result.headerErrors.map(msg => ({
          rowIndex: 0,
          field: 'row',
          code: 'HEADER_MISSING',
          message: msg
        })));
        setImportState('error');
        return;
      }

      // Validate all rows first
      const fullValidation = await validateAndTransform(result.rows);
      
      // Store all valid rows for import
      setAllValidRows(fullValidation.valid);
      setImportErrors(fullValidation.errors);
      setImportWarnings(fullValidation.warnings);
      setWillUpdate(fullValidation.willUpdate);
      setWillCreate(fullValidation.willCreate);
      setWillSkip(fullValidation.willSkip);
      
      if (fullValidation.errors.length === 0) {
        setImportState('validated');
      } else {
        setImportState('error');
      }
    } catch (error: any) {
      setImportErrors([{
        rowIndex: 0,
        field: 'row',
        code: 'PARSE_ERROR',
        message: error.message
      }]);
      setImportState('error');
    }
  }, [csvFile]);

  const handleImport = useCallback(async () => {
    if (!allValidRows.length) return;

    setImportState('importing');
    setError(null);

    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      let succeeded = 0;
      let failed = 0;
      let created = 0;
      let updated = 0;

      // Process each report individually (same pattern as clubs import)
      for (let i = 0; i < allValidRows.length; i++) {
        const report = allValidRows[i];
        
        try {
          console.log(`Processing report ${i + 1}/${allValidRows.length}: ${report.title}`);
          console.log('Report data:', report);
          
          if (report.id) {
            // Update existing report
            console.log(`Updating existing report with ID ${report.id}`);
            const updateData = {
              race_id: report.race_id,
              race_name: report.race_name,
              race_date: report.race_date,
              title: report.title,
              author_name: report.author_name,
              content_md: report.content_md,
              photos: report.photos || [] // Ensure photos is always an array
            };
            console.log('Update data:', updateData);
            const result = await raceReports.update(report.id.toString(), updateData, token);
            console.log('Update result:', result);
            updated++;
          } else {
            // Create new report
            console.log('Creating new report');
            const createData = {
              race_id: report.race_id,
              race_name: report.race_name,
              race_date: report.race_date,
              title: report.title,
              author_name: report.author_name,
              content_md: report.content_md,
              photos: report.photos || [] // Ensure photos is always an array
            };
            console.log('Create data:', createData);
            const result = await raceReports.create(createData, token);
            console.log('Create result:', result);
            created++;
          }
          succeeded++;
          console.log(`Successfully processed report: ${report.title}`);
        } catch (err) {
          console.error(`Failed to process report ${report.title}:`, err);
          console.error('Error details:', err);
          failed++;
        }

        // Update progress
        setImportProgress({
          total: allValidRows.length,
          done: i + 1,
          succeeded,
          failed,
          created,
          updated
        });
      }

      setImportState('done');
      onSuccess();
    } catch (err) {
      console.error('Race reports import error:', err);
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportState('error');
    }
  }, [allValidRows, onSuccess]);

  const resetImport = useCallback(() => {
    setImportState('idle');
    setCsvFile(null);
    setAllValidRows([]);
    setImportErrors([]);
    setImportWarnings([]);
    setWillUpdate([]);
    setWillCreate([]);
    setWillSkip([]);
    setImportProgress({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
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

  const downloadIssues = () => {
    if (!csvFile) return;
    
    // Read the original CSV file and create issues report
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const lines = csvText.split('\n');
      const header = lines[0];
      
      // Create issues CSV with original data plus error info
      const issuesData = [header + ',error_code,error_message'];
      
      // Add error rows
      importErrors.forEach(error => {
        const lineIndex = error.rowIndex - 1; // Convert to 0-based index
        if (lineIndex < lines.length) {
          const originalLine = lines[lineIndex];
          issuesData.push(`${originalLine},${error.code},"${error.message}"`);
        }
      });
      
      // Add warning rows
      importWarnings.forEach(warning => {
        const lineIndex = warning.rowIndex - 1; // Convert to 0-based index
        if (lineIndex < lines.length) {
          const originalLine = lines[lineIndex];
          issuesData.push(`${originalLine},${warning.code},"${warning.message}"`);
        }
      });
      
      const csvContent = issuesData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'race_reports_issues.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    reader.readAsText(csvFile);
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
                  onClick={handleParse}
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
                  Parse CSV
                </button>
              </div>
            )}
          </div>
        );

      case 'parsed':
        return (
          <div style={baseStyle}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', color: '#374151', marginBottom: '10px' }}>
                Parsing CSV file...
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Please wait while we parse and validate your file.
              </div>
            </div>
          </div>
        );

      case 'validated':
        const totalRows = allValidRows.length + importErrors.length + importWarnings.length;
        const totalImportable = willUpdate.length + willCreate.length;
        
        return (
          <div style={baseStyle}>
            {/* Success Banner */}
            <div style={{ marginBottom: '20px' }}>
              <Alert message="CSV parsed. Ready to review." type="success" />
            </div>

            {/* Summary Chips */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Total rows: {totalRows}
              </div>
              {willUpdate.length > 0 && (
                <div style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Will update: {willUpdate.length}
                </div>
              )}
              {willCreate.length > 0 && (
                <div style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Will create: {willCreate.length}
                </div>
              )}
              {willSkip.length > 0 && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Will skip: {willSkip.length}
                </div>
              )}
              {importWarnings.length > 0 && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Warnings: {importWarnings.length}
                </div>
              )}
              {importErrors.length > 0 && (
                <div style={{
                  backgroundColor: '#fecaca',
                  color: '#dc2626',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Errors: {importErrors.length}
                </div>
              )}
            </div>

            {/* Issues Panel */}
            {(importErrors.length > 0 || importWarnings.length > 0) && (
              <div style={{ 
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Issues ({importErrors.length + importWarnings.length})
                  </h4>
                  <button
                    onClick={downloadIssues}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #d1d5db',
                      color: '#6b7280',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Download issues.csv
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {/* Errors first */}
                  {importErrors.map((error, index) => (
                    <div key={`error-${index}`} style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                        Line {error.rowIndex}: {error.message}
                      </div>
                      {error.hint && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#991b1b', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          {error.hint}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Warnings second */}
                  {importWarnings.map((warning, index) => (
                    <div key={`warning-${index}`} style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: '#fffbeb'
                    }}>
                      <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '500' }}>
                        Line {warning.rowIndex}: {warning.message}
                      </div>
                      {warning.hint && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#a16207', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          {warning.hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview List */}
            {totalImportable > 0 && (
              <div style={{ 
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Preview ({Math.min(10, totalImportable)} of {totalImportable} reports)
                  </h4>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {[...willCreate, ...willUpdate].slice(0, 10).map((report, index) => {
                    let action = 'Create';
                    let actionColor = '#166534';
                    let actionBg = '#dcfce7';
                    let actionText = 'Will create a new report';

                    if (report.id && willUpdate.some(r => r.id === report.id)) {
                      action = 'Update';
                      actionColor = '#1e40af';
                      actionBg = '#dbeafe';
                      actionText = 'Will update existing report';
                    }
                    
                    return (
                      <div key={index} style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                            {report.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                            {report.race_name} • {report.race_date}
                            {report.author_name && <span> • {report.author_name}</span>}
                          </div>
                        </div>
                        <div 
                          style={{
                            backgroundColor: actionBg,
                            color: actionColor,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'help'
                          }}
                          title={actionText}
                        >
                          {action}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sticky Footer */}
            <div style={{ 
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              borderTop: '1px solid #e5e7eb',
              padding: '16px 0',
              margin: '20px -30px 0 -30px',
              paddingLeft: '30px',
              paddingRight: '30px'
            }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={resetImport}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Re-select file
                </button>
                <button
                  onClick={handleImport}
                  disabled={importErrors.length > 0}
                  style={{
                    backgroundColor: importErrors.length > 0 ? '#9ca3af' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: importErrors.length > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Import {totalImportable} reports
                </button>
              </div>
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
                {importProgress.created > 0 && <span>Created: {importProgress.created}</span>}
                {importProgress.updated > 0 && <span>Updated: {importProgress.updated}</span>}
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
              {importProgress.created > 0 && importProgress.updated > 0 ? (
                <>
                  Successfully processed {importProgress.succeeded} reports:
                  <br />
                  • {importProgress.created} new reports created
                  <br />
                  • {importProgress.updated} existing reports updated
                </>
              ) : importProgress.updated > 0 ? (
                `Successfully updated ${importProgress.updated} existing reports`
              ) : (
                `Successfully created ${importProgress.created} new reports`
              )}
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
            
            {importErrors.length > 0 && (
              <div style={{ 
                marginTop: '15px',
                padding: '15px', 
                backgroundColor: '#fef2f2', 
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#dc2626' }}>
                  Validation Errors ({importErrors.length}):
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {importErrors.map((err, index) => (
                    <div key={index} style={{ 
                      padding: '4px 0', 
                      fontSize: '12px',
                      color: '#dc2626'
                    }}>
                      Line {err.rowIndex}: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
            Import Race Reports from CSV
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
