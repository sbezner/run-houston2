import type { ClubCsvRow, ClubUpsert, ImportError, ValidationResult } from './errors';
import { clubs } from '@shared/services/api';
import { auth } from '@shared/services/auth';

export async function validateAndTransform(rows: ClubCsvRow[]): Promise<ValidationResult> {
  const valid: ClubUpsert[] = [];
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const willUpdate: ClubUpsert[] = [];
  const willCreate: ClubUpsert[] = [];
  const willSkip: ClubUpsert[] = [];

  // Collect all IDs for database validation
  const idsToValidate: number[] = [];
  const idToRowIndex: Map<number, number> = new Map();

  rows.forEach((row, index) => {
    const rowIndex = index + 2; // +2 because CSV has header and we're 0-indexed
    const rowErrors: ImportError[] = [];

    // Validate club_name (required)
    if (!row.club_name || row.club_name.trim() === '') {
      rowErrors.push({
        rowIndex,
        field: 'club_name',
        code: 'REQUIRED_FIELD',
        message: 'Club name is required',
        hint: 'Please provide a club name'
      });
    } else if (row.club_name.trim().length < 2) {
      rowErrors.push({
        rowIndex,
        field: 'club_name',
        code: 'FIELD_TOO_SHORT',
        message: `Club name too short (${row.club_name.trim().length} chars, min 2)`,
        hint: 'Please provide a club name with at least 2 characters'
      });
    } else if (row.club_name.length > 200) {
      rowErrors.push({
        rowIndex,
        field: 'club_name',
        code: 'FIELD_TOO_LONG',
        message: `Club name too long (${row.club_name.length} chars, max 200)`,
        hint: 'Please shorten the club name'
      });
    }

    // Validate location (optional but has length limit)
    if (row.location && row.location.length > 120) {
      rowErrors.push({
        rowIndex,
        field: 'location',
        code: 'FIELD_TOO_LONG',
        message: `Location too long (${row.location.length} chars, max 120)`,
        hint: 'Please shorten the location'
      });
    }

    // Validate website_url (optional but must be valid URL if provided)
    if (row.website_url && row.website_url.trim() !== '') {
      const url = row.website_url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        rowErrors.push({
          rowIndex,
          field: 'website_url',
          code: 'INVALID_URL',
          message: `Invalid website URL '${url}' - must start with http:// or https://`,
          hint: 'Please provide a valid URL starting with http:// or https://'
        });
      } else if (url.length > 2048) {
        rowErrors.push({
          rowIndex,
          field: 'website_url',
          code: 'FIELD_TOO_LONG',
          message: `Website URL too long (${url.length} chars, max 2048)`,
          hint: 'Please shorten the website URL'
        });
      }
    }

    // Validate description (optional but has length limit)
    if (row.description && row.description.length > 500) {
      rowErrors.push({
        rowIndex,
        field: 'description',
        code: 'FIELD_TOO_LONG',
        message: `Description too long (${row.description.length} chars, max 500)`,
        hint: 'Please shorten the description'
      });
    }

    // Validate ID (optional but must be number if provided)
    let clubId: number | null = null;
    if (row.id && row.id.trim() !== '') {
      const idValue = parseInt(row.id.trim());
      if (isNaN(idValue) || idValue <= 0) {
        rowErrors.push({
          rowIndex,
          field: 'id',
          code: 'INVALID_ID',
          message: `Invalid club ID '${row.id}' - must be a positive number`,
          hint: 'Please provide a valid club ID or leave empty for new club'
        });
      } else {
        clubId = idValue;
        idsToValidate.push(idValue);
        idToRowIndex.set(idValue, rowIndex);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Transform to ClubUpsert
      const clubUpsert: ClubUpsert = {
        id: clubId,
        club_name: row.club_name!.trim(),
        location: row.location?.trim() || null,
        website_url: row.website_url?.trim() || null,
        description: row.description?.trim() || null
      };
      valid.push(clubUpsert);
    }
  });

  // Validate IDs against database if any IDs were provided
  let existingIds: number[] = [];
  let missingIds: number[] = [];
  
  if (idsToValidate.length > 0) {
    try {
      const token = auth.getToken();
      if (token) {
        const validationResult = await clubs.validateIds(idsToValidate, token);
        existingIds = validationResult.existing_ids || [];
        missingIds = validationResult.missing_ids || [];
        
        // Add warnings for missing IDs
        missingIds.forEach(missingId => {
          const rowIndex = idToRowIndex.get(missingId);
          if (rowIndex) {
            warnings.push({
              rowIndex,
              field: 'id',
              code: 'ID_NOT_FOUND',
              message: `Club ID ${missingId} does not exist in the database`,
              hint: 'This row will be skipped during import since the specified ID cannot be found'
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to validate club IDs against database:', error);
      // Don't fail validation if ID check fails, just log the warning
    }
  }

  // Categorize valid rows based on ID status
  valid.forEach(club => {
    if (club.id) {
      if (existingIds.includes(club.id)) {
        willUpdate.push(club);
      } else {
        willSkip.push(club);
      }
    } else {
      willCreate.push(club);
    }
  });

  return {
    valid,
    errors,
    warnings,
    willUpdate,
    willCreate,
    willSkip
  };
}
