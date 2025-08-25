// import { z } from 'zod'; // Commented out since schema is not used
import type { CsvRow, ValidationError, NormalizedRow } from './errors';

// Validation functions
export function validateRequired(value: string | undefined, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateName(name: string): string | null {
  if (name.length < 2) {
    return 'Name must be at least 2 characters long';
  }
  if (name.length > 100) {
    return 'Name must be less than 100 characters';
  }
  return null;
}

export function validateDate(dateStr: string): string | null {
  // Parse the date string and create a date object
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }
  
  // Check if it can be converted to ISO format (backend requirement)
  try {
    const isoDate = date.toISOString().split('T')[0];
    // Verify the ISO format is valid
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return 'Date cannot be converted to required format (YYYY-MM-DD)';
    }
  } catch (e) {
    return 'Date cannot be converted to required format (YYYY-MM-DD)';
  }
  
  return null;
}

export function validateTime(timeStr: string): string | null {
  // First check basic format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(timeStr)) {
    return 'Invalid time format (use HH:MM or HH:MM:SS)';
  }
  
  // Check if it can be converted to ISO format (backend requirement)
  try {
    // Parse the time and create a Date object to test ISO conversion
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const testDate = new Date(2000, 0, 1, hours, minutes, seconds || 0);
    const isoTime = testDate.toTimeString().split(' ')[0];
    
    // Verify the ISO format is valid
    if (!/^\d{2}:\d{2}:\d{2}$/.test(isoTime)) {
      return 'Time cannot be converted to required format (HH:MM:SS)';
    }
  } catch (e) {
    return 'Time cannot be converted to required format (HH:MM:SS)';
  }
  
  return null;
}

export function validateSurface(surface: string): string | null {
  const validSurfaces = ['road', 'trail', 'track', 'virtual', 'other'];
  if (!validSurfaces.includes(surface.toLowerCase())) {
    return `Surface must be one of: ${validSurfaces.join(', ')}`;
  }
  return null;
}

export function validateDistance(distance: string): string | null {
  const validDistances = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', 'Other'];
  if (!validDistances.includes(distance)) {
    return `Distance must be one of: ${validDistances.join(', ')}`;
  }
  return null;
}

export function validateKidRun(kidRunStr: string): string | null {
  const validValues = ['true', 'false', 'yes', 'no', '1', '0'];
  if (!validValues.includes(kidRunStr.toLowerCase())) {
    return 'Kid run must be true/false, yes/no, or 1/0';
  }
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url) return null; // URL is optional
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
}

export function validateId(idStr: string): string | null {
  if (!idStr) return null; // ID is optional
  
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return 'ID must be a valid number';
  }
  if (id <= 0) {
    return 'ID must be a positive number';
  }
  return null;
}

// Validate that the normalized data is compatible with backend expectations
export function validateBackendCompatibility(normalized: NormalizedRow, rowNumber: number): import('./errors').ImportError[] {
  const errors: import('./errors').ImportError[] = [];
  
  // Check that required fields are present (backend will fail without these)
  if (!normalized.name || normalized.name.trim() === '') {
    errors.push({
      rowIndex: rowNumber,
      field: 'name',
      code: 'REQUIRED',
      message: 'Name is required by backend',
      originalValue: normalized.name || ''
    });
  }
  
  // Check that date can be converted to ISO format (backend requirement)
  if (normalized.date) {
    try {
      const date = new Date(normalized.date);
      if (isNaN(date.getTime())) {
        errors.push({
          rowIndex: rowNumber,
          field: 'date',
          code: 'INVALID_DATE',
          message: 'Date cannot be converted to ISO format for backend',
          originalValue: normalized.date
        });
      }
    } catch (e) {
      errors.push({
        rowIndex: rowNumber,
        field: 'date',
        code: 'INVALID_DATE',
        message: 'Date conversion failed for backend compatibility',
        originalValue: normalized.date
      });
    }
  }
  
  // Check that time can be converted to ISO format (backend requirement)
  if (normalized.start_time) {
    try {
      const [hours, minutes, seconds] = normalized.start_time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        errors.push({
          rowIndex: rowNumber,
          field: 'start_time',
          code: 'INVALID_TIME',
          message: 'Time format invalid for backend compatibility',
          originalValue: normalized.start_time
        });
      }
    } catch (e) {
      errors.push({
        rowIndex: rowNumber,
        field: 'start_time',
        code: 'INVALID_TIME',
        message: 'Time conversion failed for backend compatibility',
        originalValue: normalized.start_time
      });
    }
  }
  
  // Check that surface is one of the expected values (backend accepts any string, but frontend should be consistent)
  if (normalized.surface && !['road', 'trail', 'track', 'virtual', 'other'].includes(normalized.surface)) {
    errors.push({
      rowIndex: rowNumber,
      field: 'surface',
      code: 'INVALID_SURFACE',
      message: 'Surface should be one of: road, trail, track, virtual, other',
      originalValue: normalized.surface
    });
  }
  
  // Check that distance array is valid (backend expects list of strings)
  if (normalized.distance && !Array.isArray(normalized.distance)) {
    errors.push({
      rowIndex: rowNumber,
      field: 'distance',
      code: 'INVALID_DISTANCE',
      message: 'Distance must be an array of strings for backend compatibility',
      originalValue: JSON.stringify(normalized.distance)
    });
  }
  
  // Check that kid_run is boolean (backend expects boolean)
  if (typeof normalized.kid_run !== 'boolean') {
    errors.push({
      rowIndex: rowNumber,
      field: 'kid_run',
      code: 'INVALID_KID_RUN',
      message: 'Kid run must be true/false for backend compatibility',
      originalValue: String(normalized.kid_run)
    });
  }
  
  // Check that coordinates are valid numbers (backend expects float)
  if (normalized.latitude !== undefined && (typeof normalized.latitude !== 'number' || isNaN(normalized.latitude))) {
    errors.push({
      rowIndex: rowNumber,
      field: 'latitude',
      code: 'INVALID_LATITUDE',
      message: 'Latitude must be a valid number for backend compatibility',
      originalValue: String(normalized.latitude)
    });
  }
  
  if (normalized.longitude !== undefined && (typeof normalized.longitude !== 'number' || isNaN(normalized.longitude))) {
    errors.push({
      rowIndex: rowNumber,
      field: 'longitude',
      code: 'INVALID_LONGITUDE',
      message: 'Longitude must be a valid number for backend compatibility',
      originalValue: String(normalized.longitude)
    });
  }
  
  return errors;
}

export function validateLatitude(latStr: string): string | null {
  if (!latStr) return null; // Latitude is optional
  
  const lat = parseFloat(latStr);
  if (isNaN(lat)) {
    return 'Latitude must be a valid number';
  }
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90';
  }
  return null;
}

export function validateLongitude(lonStr: string): string | null {
  if (!lonStr) return null; // Longitude is optional
  
  const lon = parseFloat(lonStr);
  if (isNaN(lon)) {
    return 'Longitude must be a valid number';
  }
  if (lon < -180 || lon > 180) {
    return 'Longitude must be between -180 and 180';
  }
  return null;
}

// Parsing functions
export function parseDistances(distanceStr: string): string[] {
  if (!distanceStr) return ['5K'];
  
  return distanceStr
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0)
    .map(d => {
      // Handle common variations
      if (d.toLowerCase() === 'half') return 'Half Marathon';
      if (d.toLowerCase() === 'marathon') return 'Marathon';
      if (d.toLowerCase() === 'ultra') return 'Ultra';
      if (d.toLowerCase() === 'other') return 'Other';
      if (d.toLowerCase() === '5k') return '5K';
      if (d.toLowerCase() === '10k') return '10K';
      return d;
    });
}

export function parseKidRun(kidRunStr: string): boolean {
  if (!kidRunStr) return false;
  
  const lower = kidRunStr.toLowerCase();
  return lower === 'true' || lower === 'yes' || lower === '1';
}

export function parseNumber(numStr: string): number | null {
  if (!numStr) return null;
  
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

// Main validation function
export function validateCsvRow(row: CsvRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  const nameError = validateRequired(row.name, 'Name');
  if (nameError) {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: nameError,
      originalValue: row.name || ''
    });
  }

  const dateError = validateRequired(row.date, 'Date');
  if (dateError) {
    errors.push({
      row: rowNumber,
      field: 'date',
      message: dateError,
      originalValue: row.date || ''
    });
  }

  const cityError = validateRequired(row.city, 'City');
  if (cityError) {
    errors.push({
      row: rowNumber,
      field: 'city',
      message: cityError,
      originalValue: row.city || ''
    });
  }

  const stateError = validateRequired(row.state, 'State');
  if (stateError) {
    errors.push({
      row: rowNumber,
      field: 'state',
      message: stateError,
      originalValue: row.state || ''
    });
  }

  const surfaceError = validateRequired(row.surface, 'Surface');
  if (surfaceError) {
    errors.push({
      row: rowNumber,
      field: 'surface',
      message: surfaceError,
      originalValue: row.surface || ''
    });
  }

  // Optional ID validation
  if (row.id) {
    const idValidationError = validateId(row.id);
    if (idValidationError) {
      errors.push({
        row: rowNumber,
        field: 'id',
        message: idValidationError,
        originalValue: row.id
      });
    }
  }

  // Field-specific validation
  if (row.name) {
    const nameValidationError = validateName(row.name);
    if (nameValidationError) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: nameValidationError,
        originalValue: row.name
      });
    }
  }

  if (row.date) {
    const dateValidationError = validateDate(row.date);
    if (dateValidationError) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: dateValidationError,
        originalValue: row.date
      });
    }
  }

  if (row.start_time) {
    const timeValidationError = validateTime(row.start_time);
    if (timeValidationError) {
      errors.push({
        row: rowNumber,
        field: 'start_time',
        message: timeValidationError,
        originalValue: row.start_time
      });
    }
  }

  if (row.surface) {
    const surfaceValidationError = validateSurface(row.surface);
    if (surfaceValidationError) {
      errors.push({
        row: rowNumber,
        field: 'surface',
        message: surfaceValidationError,
        originalValue: row.surface
      });
    }
  }

  if (row.distance) {
    const distances = parseDistances(row.distance);
    const invalidDistances = distances.filter(d => !validateDistance(d));
    if (invalidDistances.length > 0) {
      errors.push({
        row: rowNumber,
        field: 'distance',
        message: `Invalid distances: ${invalidDistances.join(', ')}`,
        originalValue: row.distance
      });
    }
  }

  if (row.kid_run) {
    const kidRunValidationError = validateKidRun(row.kid_run);
    if (kidRunValidationError) {
      errors.push({
        row: rowNumber,
        field: 'kid_run',
        message: kidRunValidationError,
        originalValue: row.kid_run
      });
    }
  }

  if (row.official_website_url) {
    const urlValidationError = validateUrl(row.official_website_url);
    if (urlValidationError) {
      errors.push({
        row: rowNumber,
        field: 'official_website_url',
        message: urlValidationError,
        originalValue: row.official_website_url
      });
    }
  }

  if (row.latitude) {
    const latValidationError = validateLatitude(row.latitude);
    if (latValidationError) {
      errors.push({
        row: rowNumber,
        field: 'latitude',
        message: latValidationError,
        originalValue: row.latitude
      });
    }
  }

  if (row.longitude) {
    const lonValidationError = validateLongitude(row.longitude);
    if (lonValidationError) {
      errors.push({
        row: rowNumber,
        field: 'longitude',
        message: lonValidationError,
        originalValue: row.longitude
      });
    }
  }

  return errors;
}

// Normalization function
export function normalizeCsvRow(row: CsvRow): NormalizedRow {
  return {
    id: row.id ? parseInt(row.id) : undefined,
    name: row.name || '',
    date: row.date || '',
    start_time: row.start_time,
    address: row.address,
    city: row.city || '',
    state: row.state || '',
    zip: row.zip,
    surface: row.surface || 'road',
    distance: parseDistances(row.distance || '5K'),
    kid_run: parseKidRun(row.kid_run || 'false'),
    official_website_url: row.official_website_url || row.official_w,
    source: row.source || 'manual',
    latitude: row.latitude ? parseNumber(row.latitude) ?? undefined : undefined,
    longitude: row.longitude ? parseNumber(row.longitude) ?? undefined : undefined
  };
}

// Main validation and transformation function
export function validateAndTransform(rows: CsvRow[]): {
  valid: import('./errors').RaceUpsert[];
  errors: import('./errors').ImportError[];
  warnings: import('./errors').ImportError[];
} {
  const valid: import('./errors').RaceUpsert[] = [];
  const errors: import('./errors').ImportError[] = [];
  const warnings: import('./errors').ImportError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const validationErrors = validateCsvRow(row, rowNumber);
    
    if (validationErrors.length === 0) {
      try {
        const normalized = normalizeCsvRow(row);
        
        // Additional backend compatibility checks
        const backendCompatibilityErrors = validateBackendCompatibility(normalized, rowNumber);
        if (backendCompatibilityErrors.length > 0) {
          backendCompatibilityErrors.forEach(error => {
            errors.push(error);
          });
          return; // Skip this row if backend compatibility fails
        }
        
        // Preserve ID if it exists for update functionality
        const raceUpsert: import('./errors').RaceUpsert = {
          ...normalized,
          id: normalized.id // Keep the ID if it exists
        };
        valid.push(raceUpsert);
      } catch (error) {
        errors.push({
          rowIndex: rowNumber,
          field: 'row',
          code: 'PARSE_ERROR',
          message: `Failed to normalize row: ${error}`,
          originalValue: JSON.stringify(row)
        });
      }
    } else {
      validationErrors.forEach(error => {
        errors.push({
          rowIndex: rowNumber,
          field: error.field as keyof import('./errors').RaceUpsert,
          code: 'INVALID_DATE' as any, // You might want to map these more specifically
          message: error.message,
          originalValue: error.originalValue
        });
      });
    }
  });

  return { valid, errors, warnings };
}
