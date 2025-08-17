// import { z } from 'zod'; // Commented out since schema is not used
import type { RaceCsvRow, RaceUpsert, ImportError, ValidationResult, ImportStats } from './errors';

// Helper functions for data transformation
function normalizeString(value: string | undefined): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ');
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const normalized = normalizeString(dateStr);
  console.log('=== DATE PARSING DEBUG ===');
  console.log('Input date:', dateStr);
  console.log('Normalized:', normalized);
  console.log('Length:', normalized.length);
  console.log('Contains slash:', normalized.includes('/'));
  console.log('Contains dash:', normalized.includes('-'));
  
  // Test the specific patterns we expect
  const testPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const testMatch = normalized.match(testPattern);
  console.log('Test pattern:', testPattern.source);
  console.log('Test match:', testMatch);
  
  // Try various date formats (order matters - more specific first)
  const formats = [
    // YYYY-MM-DD (ISO format) - check this FIRST
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // MMM-DD-YY or MMM-DD-YYYY
    /^(\w{3})-(\d{1,2})-(\d{2,4})$/,
    // DD-MMM-YY or DD-MMM-YYYY
    /^(\d{1,2})-(\w{3})-(\d{2,4})$/
  ];
  
  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    const match = normalized.match(format);
    console.log(`Format ${i + 1}:`, format.source, '-> match:', match);
    
    if (match) {
      console.log('Processing match:', match);
      console.log('Format source:', format.source);
      console.log('Format source includes YYYY:', format.source.includes('YYYY'));
      try {
        if (format.source.includes('(\\d{4})')) {
          if (format.source.includes('(\\w{3})')) {
            // Month name format
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => m === match[2]);
            if (monthIndex !== -1) {
              const month = (monthIndex + 1).toString().padStart(2, '0');
              const day = match[1].padStart(2, '0');
              const year = match[3].length === 2 ? '20' + match[3] : match[3];
              console.log('Month name format - month:', month, 'day:', day, 'year:', year);
              return `${year}-${month}-${day}`;
            }
          } else if (format.source.includes('(\\d{4})-')) {
            // YYYY-MM-DD (ISO format) - already in correct format
            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            console.log('ISO format - year:', year, 'month:', month, 'day:', day);
            console.log('Returning:', `${year}-${month}-${day}`);
            return `${year}-${month}-${day}`;
          } else {
            // MM/DD/YYYY format
            const month = match[1].padStart(2, '0');
            const day = match[2].padStart(2, '0');
            const year = match[3];
            console.log('MM/DD/YYYY format - month:', month, 'day:', day, 'year:', year);
            console.log('Returning:', `${year}-${month}-${day}`);
            return `${year}-${month}-${day}`;
          }
        } else if (format.source.includes('(\\d{2,4})')) {
          if (format.source.includes('MMM')) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => m === match[2]);
            if (monthIndex !== -1) {
              const month = (monthIndex + 1).toString().padStart(2, '0');
              const day = match[1].padStart(2, '0');
              const year = '20' + match[3];
              console.log('MMM-DD-YY format - month:', month, 'day:', day, 'year:', year);
              return `${year}-${month}-${day}`;
            }
          }
        }
      } catch (err) {
        console.log('Error parsing format:', err);
        continue;
      }
    }
  }
  
  console.log('=== NO VALID DATE FORMAT FOUND ===');
  console.log('Final result: null');
  return null;
}

// Removed isValidDate function since we're not using it anymore

function parseTime(timeStr: string): string | null {
  if (!timeStr) return null;
  
  const normalized = normalizeString(timeStr);
  
  // Try various time formats
  const formats = [
    // HH:mm:ss
    /^(\d{1,2}):(\d{2}):(\d{2})$/,
    // H:mm or HH:mm
    /^(\d{1,2}):(\d{2})$/,
    // h:mm A or h:mm AM/PM
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  ];
  
  for (const format of formats) {
    const match = normalized.match(format);
    if (match) {
      try {
        if (format.source.includes('AM|PM')) {
          // 12-hour format
          let hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          const period = match[3].toUpperCase();
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        } else if (format.source.includes('HH:mm:ss')) {
          // Already in correct format
          return normalized;
        } else {
          // HH:mm format
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        }
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

function normalizeSurface(surface: string): string | null {
  if (!surface) return null;
  
  const normalized = normalizeString(surface).toLowerCase();
  
  const surfaceMap: Record<string, string> = {
    'road': 'road',
    'trail': 'trail',
    'track': 'track',
    'mixed': 'mixed',
    'asphalt': 'road',
    'concrete': 'road',
    'dirt': 'trail',
    'grass': 'trail',
    'gravel': 'trail'
  };
  
  return surfaceMap[normalized] || null;
}

function parseKidRun(value: string): boolean | null {
  if (!value) return null;
  
  const normalized = normalizeString(value).toLowerCase();
  
  const trueValues = ['true', 'yes', 'y', '1', 'on'];
  const falseValues = ['false', 'no', 'n', '0', 'off'];
  
  if (trueValues.includes(normalized)) return true;
  if (falseValues.includes(normalized)) return false;
  
  return null;
}

function normalizeUrl(url: string): string | null {
  if (!url) return null;
  
  const normalized = normalizeString(url);
  
  try {
    // If it already has a scheme, validate it
    if (normalized.includes('://')) {
      new URL(normalized);
      return normalized;
    }
    
    // If it looks like a domain, add https://
    if (normalized.includes('.') && !normalized.includes(' ')) {
      const urlWithScheme = `https://${normalized}`;
      new URL(urlWithScheme);
      return urlWithScheme;
    }
    
    return null;
  } catch {
    return null;
  }
}

function parseCoordinate(value: string): number | null {
  if (!value) return null;
  
  const parsed = parseFloat(normalizeString(value));
  return isNaN(parsed) ? null : parsed;
}

function validateCoordinates(lat: number | null, lon: number | null): boolean {
  if (lat === null && lon === null) return true;
  if (lat !== null && lon !== null) {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  return false;
}

// Validation schema - commented out for now
// const raceSchema = z.object({
//   name: z.string().min(1, "Name is required"),
//   date: z.string().min(1, "Date is required"),
//   start_time: z.string().min(1, "Start time is required"),
//   address: z.string().nullable(),
//   city: z.string().min(1, "City is required"),
//   state: z.string().min(1, "State is required"),
//   zip: z.string().nullable(),
//   surface: z.string().min(1, "Surface is required"),
//   kid_run: z.boolean(),
//   official_website_url: z.string().nullable(),
//   latitude: z.number().nullable(),
//   longitude: z.number().nullable()
// });

export function validateAndTransform(rows: RaceCsvRow[]): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const valid: RaceUpsert[] = [];
  
  // Track duplicates by natural key (name, date, city)
  const duplicateTracker = new Map<string, number>();
  
  rows.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based for user display
    const rowErrors: ImportError[] = [];
    
    // Normalize and transform data
    const normalized = {
      name: normalizeString(row.name),
      date: parseDate(row.date || ''),
      start_time: parseTime(row.start_time || ''),
      address: normalizeString(row.address),
      city: normalizeString(row.city),
      state: normalizeString(row.state),
      zip: normalizeString(row.zip),
      surface: normalizeSurface(row.surface || ''),
      kid_run: parseKidRun(row.kid_run || ''),
      official_website_url: normalizeUrl(row.official_website_url || ''),
      latitude: row.latitude ? parseCoordinate(row.latitude) : null,
      longitude: row.longitude ? parseCoordinate(row.longitude) : null
    };
    
    // Check for required fields
    if (!normalized.name) {
      rowErrors.push({
        rowIndex,
        field: 'name',
        code: 'REQUIRED',
        message: 'Name is required',
        originalValue: row.name
      });
    }
    
    if (!normalized.date) {
      rowErrors.push({
        rowIndex,
        field: 'date',
        code: 'INVALID_DATE',
        message: 'Invalid date format',
        originalValue: row.date,
        hint: 'Use MM/DD/YYYY, MMM-DD-YYYY, or YYYY-MM-DD format'
      });
    }
    
    if (!normalized.start_time) {
      rowErrors.push({
        rowIndex,
        field: 'start_time',
        code: 'INVALID_TIME',
        message: 'Invalid time format',
        originalValue: row.start_time,
        hint: 'Use HH:mm, HH:mm:ss, or h:mm AM/PM format'
      });
    }
    
    if (!normalized.city) {
      rowErrors.push({
        rowIndex,
        field: 'city',
        code: 'REQUIRED',
        message: 'City is required',
        originalValue: row.city
      });
    }
    
    if (!normalized.state) {
      rowErrors.push({
        rowIndex,
        field: 'state',
        code: 'REQUIRED',
        message: 'State is required',
        originalValue: row.state
      });
    } else if (normalized.state.length !== 2) {
      rowErrors.push({
        rowIndex,
        field: 'state',
        code: 'OUT_OF_RANGE',
        message: 'State must be exactly 2 characters',
        originalValue: row.state,
        hint: 'Use 2-letter state code (e.g., TX, CA)'
      });
    }
    
    if (!normalized.surface) {
      rowErrors.push({
        rowIndex,
        field: 'surface',
        code: 'REQUIRED',
        message: 'Surface is required',
        originalValue: row.surface,
        hint: 'Must be one of: road, trail, track, mixed'
      });
    }
    
    if (normalized.kid_run === null) {
      rowErrors.push({
        rowIndex,
        field: 'kid_run',
        code: 'REQUIRED',
        message: 'Kid run value is required',
        originalValue: row.kid_run,
        hint: 'Use TRUE/FALSE, Yes/No, Y/N, or 1/0'
      });
    }
    
    if (normalized.official_website_url === null && row.official_website_url) {
      rowErrors.push({
        rowIndex,
        field: 'official_website_url',
        code: 'INVALID_URL',
        message: 'Invalid URL format',
        originalValue: row.official_website_url,
        hint: 'Must be a valid URL or domain (e.g., www.example.com)'
      });
    }
    
    // Check coordinate consistency
    if (!validateCoordinates(normalized.latitude, normalized.longitude)) {
      rowErrors.push({
        rowIndex,
        field: 'latitude',
        code: 'INCONSISTENT_COORDS',
        message: 'Both latitude and longitude must be provided together',
        originalValue: `${row.latitude}, ${row.longitude}`,
        hint: 'Provide both coordinates or neither'
      });
    }
    
    // Check coordinate ranges
    if (normalized.latitude !== null && (normalized.latitude < -90 || normalized.latitude > 90)) {
      rowErrors.push({
        rowIndex,
        field: 'latitude',
        code: 'OUT_OF_RANGE',
        message: 'Latitude must be between -90 and 90',
        originalValue: row.latitude,
        hint: 'Valid range: -90 to 90 degrees'
      });
    }
    
    if (normalized.longitude !== null && (normalized.longitude < -180 || normalized.longitude > 180)) {
      rowErrors.push({
        rowIndex,
        field: 'longitude',
        code: 'OUT_OF_RANGE',
        message: 'Longitude must be between -180 and 180',
        originalValue: row.longitude,
        hint: 'Valid range: -180 to 180 degrees'
      });
    }
    
         // Check for duplicates (only for races without IDs - new insertions)
     if (!row.id && normalized.name && normalized.date && normalized.city) {
       const naturalKey = `${normalized.name.toLowerCase()}-${normalized.date}-${normalized.city.toLowerCase()}`;
       
       if (duplicateTracker.has(naturalKey)) {
         const firstOccurrence = duplicateTracker.get(naturalKey)!;
         warnings.push({
           rowIndex: firstOccurrence,
           field: 'row',
           code: 'DUPLICATE',
           message: 'Duplicate race found',
           hint: 'This row will be skipped in favor of the last occurrence'
         });
       } else {
         duplicateTracker.set(naturalKey, rowIndex);
       }
     }
    
         // If no errors, add to valid races
     if (rowErrors.length === 0) {
       valid.push({
         id: row.id ? parseInt(row.id) : undefined, // Preserve ID for updates
         name: normalized.name,
         date: normalized.date!,
         start_time: normalized.start_time!,
         address: normalized.address || null,
         city: normalized.city,
         state: normalized.state.toUpperCase(),
         zip: normalized.zip || null,
         surface: normalized.surface as any,
         kid_run: normalized.kid_run!,
         official_website_url: normalized.official_website_url,
         latitude: normalized.latitude,
         longitude: normalized.longitude
       });
     } else {
       errors.push(...rowErrors);
     }
  });
  
  // Filter out warnings for rows that are now valid (keep only warnings for skipped duplicates)
  const finalWarnings = warnings.filter(warning => 
    warning.code === 'DUPLICATE' && 
    !valid.some(race => 
      race.name.toLowerCase() === rows[warning.rowIndex - 1]?.name?.toLowerCase() &&
      race.date === parseDate(rows[warning.rowIndex - 1]?.date || '') &&
      race.city.toLowerCase() === rows[warning.rowIndex - 1]?.city?.toLowerCase()
    )
  );
  
  const stats: ImportStats = {
    total: rows.length,
    valid: valid.length,
    invalid: errors.length,
    duplicates: finalWarnings.length
  };
  
  return {
    valid,
    errors,
    warnings: finalWarnings,
    stats
  };
}
