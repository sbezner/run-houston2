import Papa from 'papaparse';
import type { RaceCsvRow, HeaderValidationResult, ImportError } from './errors';

const REQUIRED_HEADERS = ['name', 'date', 'start_time', 'city', 'state', 'surface', 'kid_run'];

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

export function parseCsvFile(file: File): Promise<{ rows: RaceCsvRow[], headerErrors: string[] }> {
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

        const rows: RaceCsvRow[] = results.data.map((row: any) => {
          const raceRow: RaceCsvRow = {};
          
          // Debug: Log the raw row data
          console.log('Raw CSV row:', row);
          
          // Only map fields that the backend RaceCreate model expects
          const allowedFields = [
            'id', 'name', 'date', 'start_time', 'address', 'city', 'state', 
            'zip', 'surface', 'distance', 'kid_run', 'official_website_url', 
            'source', 'latitude', 'longitude'
          ];
          
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase();
            if (allowedFields.includes(normalizedKey)) {
              raceRow[normalizedKey as keyof RaceCsvRow] = row[key];
            }
          });
          
          // Normalize ID field: convert empty string to null for new races
          if (raceRow.id !== undefined) {
            raceRow.id = raceRow.id && raceRow.id.toString().trim() !== '' ? raceRow.id.toString() : null;
          }
          
          // Debug: Log the mapped race row
          console.log('Mapped race row:', raceRow);

          return raceRow;
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
