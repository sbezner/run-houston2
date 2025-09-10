import Papa from 'papaparse';
import type { RaceReportCsvRow, HeaderValidationResult, ImportError } from './errors';

const REQUIRED_HEADERS = ['race_name', 'race_date', 'title', 'content_md'];

export function validateHeaders(headers: string[]): HeaderValidationResult {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const missingHeaders = REQUIRED_HEADERS.filter(required => 
    !normalizedHeaders.includes(required)
  );

  const errors: ImportError[] = missingHeaders.map(header => ({
    rowIndex: 0,
    field: 'row',
    code: 'HEADER_MISSING',
    message: `Missing required header: ${header}`,
    hint: `CSV must contain these columns: ${REQUIRED_HEADERS.join(', ')}`
  }));

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
    errors
  };
}

export function parseCsvFile(file: File): Promise<{ rows: RaceReportCsvRow[], headerErrors: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false, // Keep everything as strings
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }

        const headers = Object.keys(results.data[0] || {});
        console.log('Detected CSV headers:', headers);
        const headerValidation = validateHeaders(headers);

        if (!headerValidation.isValid) {
          resolve({
            rows: [],
            headerErrors: headerValidation.errors.map(e => e.message)
          });
          return;
        }

        const rows: RaceReportCsvRow[] = results.data.map((row: any) => {
          const reportRow: RaceReportCsvRow = {};
          
          // Debug: Log the raw row data
          console.log('Raw CSV row:', row);
          
          // Only map fields that the backend expects
          const allowedFields = [
            'id', 'race_id', 'race_name', 'race_date', 'title', 'author_name', 'content_md', 'photos'
          ];
          
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase();
            if (allowedFields.includes(normalizedKey)) {
              reportRow[normalizedKey as keyof RaceReportCsvRow] = row[key];
            }
          });
          
          // Normalize ID field: convert empty string to null for new reports
          if (reportRow.id !== undefined) {
            reportRow.id = reportRow.id && reportRow.id.toString().trim() !== '' ? reportRow.id.toString() : null;
          }
          
          // Debug: Log the mapped report row
          console.log('Mapped report row:', reportRow);

          return reportRow;
        });

        resolve({
          rows,
          headerErrors: []
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}
