import Papa from 'papaparse';
import type { ClubCsvRow, HeaderValidationResult, ImportError } from './errors';

const REQUIRED_HEADERS = ['club_name', 'location', 'website_url', 'description'];

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

export function parseCsvFile(file: File): Promise<{ rows: ClubCsvRow[], headerErrors: string[] }> {
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

        const rows: ClubCsvRow[] = results.data.map((row: any) => {
          const clubRow: ClubCsvRow = {};
          
          // Debug: Log the raw row data
          console.log('Raw CSV row:', row);
          
          // Only map fields that the backend expects
          const allowedFields = [
            'id', 'club_name', 'location', 'website_url', 'description'
          ];
          
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase();
            if (allowedFields.includes(normalizedKey)) {
              clubRow[normalizedKey as keyof ClubCsvRow] = row[key];
            }
          });
          
          // Normalize ID field: convert empty string to null for new clubs
          if (clubRow.id !== undefined) {
            clubRow.id = clubRow.id && clubRow.id.toString().trim() !== '' ? clubRow.id.toString() : null;
          }
          
          // Debug: Log the mapped club row
          console.log('Mapped club row:', clubRow);

          return clubRow;
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
