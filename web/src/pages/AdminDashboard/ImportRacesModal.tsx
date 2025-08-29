import React from 'react';
import { parseCsvFile } from './ImportCsv/parseCsv';
import { validateAndTransform } from './ImportCsv/validation';
import { downloadErrorsCsv } from './ImportCsv/download';
import type { RaceUpsert, ImportError } from './ImportCsv/errors';
import { races } from '../../services/api';
import { Alert } from '../../components/Alert';
import { auth } from '../../services/auth';

interface ImportRacesModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportRacesModal: React.FC<ImportRacesModalProps> = ({ onClose, onImportComplete }) => {
  const [importState, setImportState] = React.useState<'idle' | 'parsed' | 'validated' | 'committing' | 'done' | 'error'>('idle');
  const [previewRows, setPreviewRows] = React.useState<RaceUpsert[]>([]);
  const [allValidRows, setAllValidRows] = React.useState<RaceUpsert[]>([]); // Store all valid rows for import
  const [importErrors, setImportErrors] = React.useState<ImportError[]>([]);
  const [importWarnings, setImportWarnings] = React.useState<ImportError[]>([]);
  const [commitProgress, setCommitProgress] = React.useState({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
  const [aborter, setAborter] = React.useState<AbortController | null>(null);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);

  const handleCSVParse = React.useCallback(async () => {
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
      const fullValidation = validateAndTransform(result.rows);
      
      // Set preview to first 10 rows maximum
      setPreviewRows(fullValidation.valid.slice(0, 10));
      setAllValidRows(fullValidation.valid); // Store all valid rows for import
      setImportErrors(fullValidation.errors);
      setImportWarnings(fullValidation.warnings);
      
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

  const handleCSVCommit = React.useCallback(async () => {
    if (allValidRows.length === 0) return;

    const controller = new AbortController();
    setAborter(controller);
    setImportState('committing');
    
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    setCommitProgress(prev => ({ ...prev, total: allValidRows.length }));

    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      // Process in batches of 100 with concurrency of 3
      const batchSize = 100;
      const concurrency = 3;
      
      for (let i = 0; i < allValidRows.length; i += batchSize) {
        if (controller.signal.aborted) break;
        
        const batch = allValidRows.slice(i, i + batchSize);
        const promises = batch.map(async (race) => {
          try {
            // Normalize the race data before sending to API
            const normalizedRace = { 
              ...race,
              source: race.source || 'csv_import', // Set source for CSV imports
              // Convert empty string ID to null for new races
              id: race.id && race.id.toString().trim() !== '' ? parseInt(race.id.toString()) : null
            };
            
            // Normalize date format if it's a string
            if (typeof normalizedRace.date === 'string') {
              try {
                // Try to parse and normalize the date
                const parsedDate = new Date(normalizedRace.date);
                if (isNaN(parsedDate.getTime())) {
                  throw new Error(`Invalid date: ${normalizedRace.date}`);
                }
                normalizedRace.date = parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
              } catch (e) {
                console.error('Date normalization failed:', e instanceof Error ? e.message : String(e));
                throw new Error(`Date validation failed: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
           
            const responseData = await races.create(normalizedRace, token);
            const operationType = responseData.operation_type;
            
            // Log the operation type for debugging
            console.log(`Race ${normalizedRace.id ? `ID ${normalizedRace.id}` : 'new'}: ${operationType}`);
            
            if (operationType && operationType.trim().toLowerCase() === 'updated') {
              totalUpdated++;
            } else {
              totalCreated++;
            }
            
            totalSucceeded++;
            return { success: true, race };
          } catch (error: any) {
            totalFailed++;
            return { success: false, race, error: error.message };
          }
        });

        // Process with concurrency limit
        for (let j = 0; j < promises.length; j += concurrency) {
          if (controller.signal.aborted) break;
          const concurrentPromises = promises.slice(j, j + concurrency);
          await Promise.all(concurrentPromises);
        }

        setCommitProgress(prev => ({
          ...prev,
          done: Math.min(i + batchSize, allValidRows.length),
          succeeded: totalSucceeded,
          failed: totalFailed,
          created: totalCreated,
          updated: totalUpdated
        }));
      }

      if (!controller.signal.aborted) {
        setImportState('done');
        onImportComplete();
      }
    } catch (error: any) {
      if (!controller.signal.aborted) {
        setImportErrors([{
          rowIndex: 0,
          field: 'row',
          code: 'PARSE_ERROR',
          message: error.message
        }]);
        setImportState('error');
      }
    } finally {
      setAborter(null);
    }
  }, [allValidRows, onImportComplete]);

  const cancelImport = React.useCallback(() => {
    if (aborter) {
      aborter.abort();
      setAborter(null);
    }
    setImportState('idle');
  }, [aborter]);

  const resetImport = React.useCallback(() => {
    setImportState('idle');

    setPreviewRows([]);
    setAllValidRows([]);
    setImportErrors([]);
    setImportWarnings([]);
    setCommitProgress({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
    setCsvFile(null);
    if (aborter) {
      aborter.abort();
      setAborter(null);
    }
  }, [aborter]);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setImportErrors([{
          rowIndex: 0,
          field: 'row',
          code: 'PARSE_ERROR',
          message: 'File size must be less than 5MB'
        }]);
        setImportState('error');
        setCsvFile(null);
        return;
      }
      
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setImportErrors([{
          rowIndex: 0,
          field: 'row',
          code: 'PARSE_ERROR',
          message: 'File must be a CSV'
        }]);
        setImportState('error');
        setCsvFile(null);
        return;
      }
      
      setCsvFile(file);
      setImportErrors([]);
      setImportState('idle');
    }
  }, []);

  const downloadTemplate = () => {
    const csvContent = 'id,name,date,location,description,website,registration_url,source\n,Example Race,2025-01-15,Example Location,Example race description,https://example.com,https://example.com/register,csv_import';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'races_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prevent flashing by using opacity transitions and stable layout
  const renderContent = () => {
    const baseStyle = {
      opacity: 1,
      transition: 'opacity 0.2s ease-in-out',
      minHeight: '200px' // Maintain consistent height to prevent layout shifts
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
                <p>• Maximum rows for preview: 10</p>
              </div>
            </div>
            
            {csvFile && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                  Selected file: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  onClick={handleCSVParse}
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

      case 'error':
        return (
          <div style={baseStyle}>
            <Alert message={`Found ${importErrors.length} errors. Please fix them before proceeding.`} type="error" />
            
            {/* Display detailed error list */}
            {importErrors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>Error Details:</h4>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {importErrors.map((error, index) => (
                    <div key={index} style={{ 
                      marginBottom: '10px', 
                      padding: '10px', 
                      backgroundColor: 'white', 
                      border: '1px solid #f5c6cb',
                      borderRadius: '6px',
                      borderLeft: '4px solid #dc3545'
                    }}>
                                              <div style={{ fontWeight: 'bold', color: '#721c24', marginBottom: '5px' }}>
                          Row {error.rowIndex}: {String(error.field)}
                        </div>
                      <div style={{ color: '#721c24', marginBottom: '5px' }}>
                        {error.message}
                      </div>
                      {error.originalValue && (
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>
                          <strong>Value:</strong> {error.originalValue}
                        </div>
                      )}
                      {error.hint && (
                        <div style={{ color: '#856404', fontSize: '12px', backgroundColor: '#fff3cd', padding: '5px', borderRadius: '4px' }}>
                          💡 {error.hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <button
                onClick={() => downloadErrorsCsv(importErrors)}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '15px'
                }}
              >
                Download Errors CSV
              </button>
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
              {importErrors.length === 0 && (
                <button
                  onClick={() => setImportState('validated')}
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
                  Proceed
                </button>
              )}
            </div>
          </div>
        );

      case 'validated':
        return (
          <div style={baseStyle}>
            <div style={{ marginBottom: '15px' }}>
              <p>Preview: {previewRows.length} of {allValidRows.length} valid rows ready to import</p>
              {csvFile && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Showing first 10 rows for preview. All {allValidRows.length} valid rows will be imported.
                </p>
              )}
              
              {/* Display detailed warnings */}
              {importWarnings.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#856404' }}>⚠️ Warnings ({importWarnings.length}):</h4>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid #ffeaa7', 
                    borderRadius: '8px',
                    padding: '10px',
                    backgroundColor: '#fffbf0'
                  }}>
                    {importWarnings.map((warning, index) => (
                      <div key={index} style={{ 
                        marginBottom: '8px', 
                        padding: '8px', 
                        backgroundColor: 'white', 
                        border: '1px solid #ffeaa7',
                        borderRadius: '6px',
                        borderLeft: '4px solid #f39c12'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '3px' }}>
                          Row {warning.rowIndex}: {String(warning.field)}
                        </div>
                        <div style={{ color: '#856404', marginBottom: '3px' }}>
                          {warning.message}
                        </div>
                        {warning.hint && (
                          <div style={{ color: '#856404', fontSize: '12px', backgroundColor: '#fff3cd', padding: '4px', borderRadius: '4px' }}>
                            💡 {warning.hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
                             {/* Preview valid rows */}
               <div style={{ marginBottom: '20px' }}>
                 <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#28a745' }}>✅ Valid Rows ({previewRows.length}):</h4>
                 
                 {/* Show update vs create summary */}
                 {(() => {
                   const racesWithId = previewRows.filter(race => race.id);
                   const newRaces = previewRows.filter(race => !race.id);
                   
                   return (
                     <div style={{ 
                       marginBottom: '15px', 
                       padding: '10px', 
                       backgroundColor: '#e8f5e8', 
                       borderRadius: '6px',
                       border: '1px solid #d4edda'
                     }}>
                       <div style={{ fontSize: '14px', color: '#155724' }}>
                         📊 Import Summary:
                         {racesWithId.length > 0 && (
                           <span style={{ marginLeft: '10px' }}>
                             🔄 {racesWithId.length} race{racesWithId.length !== 1 ? 's' : ''} will be updated
                           </span>
                         )}
                         {newRaces.length > 0 && (
                           <span style={{ marginLeft: '10px' }}>
                             ➕ {newRaces.length} new race{newRaces.length !== 1 ? 's' : ''} will be created
                           </span>
                         )}
                       </div>
                     </div>
                   );
                 })()}
                 
                 <div style={{ 
                   maxHeight: '300px', 
                   overflowY: 'auto', 
                   border: '1px solid #d4edda', 
                   borderRadius: '8px',
                   padding: '10px',
                   backgroundColor: '#f8fff9'
                 }}>
                   {previewRows.slice(0, 10).map((race, index) => (
                     <div key={index} style={{ 
                       marginBottom: '8px', 
                       padding: '8px', 
                       backgroundColor: 'white', 
                       border: '1px solid #d4edda',
                       borderRadius: '6px',
                       borderLeft: `4px solid ${race.id ? '#ffc107' : '#28a745'}`
                     }}>
                       <div style={{ fontWeight: 'bold', color: '#155724', marginBottom: '3px' }}>
                         {race.id ? `🔄 Update: ${race.name}` : `➕ New: ${race.name}`}
                       </div>
                       <div style={{ color: '#155724', fontSize: '12px' }}>
                         {race.date} • {race.city}, {race.state} • {race.surface}
                         {race.id && <span style={{ color: '#856404', marginLeft: '10px' }}>(ID: {race.id})</span>}
                       </div>
                     </div>
                   ))}
                   {previewRows.length > 10 && (
                     <div style={{ 
                       textAlign: 'center', 
                       color: '#666', 
                       fontSize: '12px', 
                       fontStyle: 'italic',
                       padding: '10px'
                     }}>
                       ... and {previewRows.length - 10} more rows
                     </div>
                   )}
                 </div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                Commit Import
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
          <div style={baseStyle}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                width: '100%', 
                backgroundColor: '#e9ecef', 
                borderRadius: '10px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  width: `${(commitProgress.done / commitProgress.total) * 100}%`,
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
          <div style={baseStyle}>
            <Alert message="Import completed successfully!" type="success" />
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {commitProgress.created > 0 && commitProgress.updated > 0 ? (
                <>
                  Successfully processed {commitProgress.succeeded} races:
                  <br />
                  • {commitProgress.created} new races created
                  <br />
                  • {commitProgress.updated} existing races updated
                </>
              ) : commitProgress.updated > 0 ? (
                `Successfully updated ${commitProgress.updated} existing races`
              ) : (
                `Successfully created ${commitProgress.created} new races`
              )}
              {commitProgress.failed > 0 && (
                <>
                  <br />
                  ⚠️ {commitProgress.failed} races failed to process
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
            📤 Import Races from CSV
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
