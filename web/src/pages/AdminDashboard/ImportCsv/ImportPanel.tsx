import React from 'react';
import { parseCsvFile } from './parseCsv';
import { validateAndTransform } from './validation';
import { downloadErrorsCsv } from './download';
import type { RaceUpsert, ImportError } from './errors';
import { api } from '../../../services/api';
import { auth } from '../../../services/auth';
import { Alert } from '../../../components/Alert';

interface ImportPanelProps {
  onImportComplete: () => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({ onImportComplete }) => {
  const [importState, setImportState] = React.useState<'idle' | 'parsed' | 'validated' | 'committing' | 'done' | 'error'>('idle');
  const [previewRows, setPreviewRows] = React.useState<RaceUpsert[]>([]);
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

      
      // Validate and transform
      const validation = validateAndTransform(result.rows);
      setPreviewRows(validation.valid);
      setImportErrors(validation.errors);
      setImportWarnings(validation.warnings);
      
      if (validation.errors.length === 0) {
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
    if (previewRows.length === 0) return;

    const controller = new AbortController();
    setAborter(controller);
    setImportState('committing');
    
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    setCommitProgress(prev => ({ ...prev, total: previewRows.length }));

    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token');

      // Process in batches of 100 with concurrency of 3
      const batchSize = 100;
      const concurrency = 3;
      
      for (let i = 0; i < previewRows.length; i += batchSize) {
        if (controller.signal.aborted) break;
        
        const batch = previewRows.slice(i, i + batchSize);
        const promises = batch.map(async (race) => {
          try {
            const response = await api.post('/races', race, token);
            const responseData = await response;
            const operationType = responseData.operation_type;
            
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
          done: Math.min(i + batchSize, previewRows.length),
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
  }, [previewRows, onImportComplete]);

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
      setCsvFile(file);
      setImportState('idle');
    }
  }, []);

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
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ marginBottom: '15px' }}
            />
            {csvFile && (
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
            )}
          </div>
        );

      case 'error':
        return (
          <div style={baseStyle}>
            <Alert message={`Found ${importErrors.length} errors. Please fix them before proceeding.`} type="error" />
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
              <p>Preview: {previewRows.length} valid rows ready to import</p>
              {importWarnings.length > 0 && (
                <p style={{ color: '#856404' }}>⚠️ {importWarnings.length} warnings (duplicates, etc.)</p>
              )}
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
              Import Another File
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h3 style={{ fontSize: '20px', marginBottom: '20px', color: '#333' }}>📤 Import Races from CSV</h3>
      {renderContent()}
    </div>
  );
};
