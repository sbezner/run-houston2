import type { RaceReportCsvRow, RaceReportUpsert, ImportError, ValidationResult } from './errors';
import { raceReports } from '@shared/services/api';
import { auth } from '@shared/services/auth';

export async function validateAndTransform(rows: RaceReportCsvRow[]): Promise<ValidationResult> {
  const valid: RaceReportUpsert[] = [];
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const willUpdate: RaceReportUpsert[] = [];
  const willCreate: RaceReportUpsert[] = [];
  const willSkip: RaceReportUpsert[] = [];

  // Collect all IDs for database validation
  const reportIdsToValidate: number[] = [];
  const reportIdToRowIndex: Map<number, number> = new Map();
  const raceIdsToValidate: number[] = [];
  const raceIdToRowIndex: Map<number, number> = new Map();

  rows.forEach((row, index) => {
    const rowIndex = index + 2; // +2 because CSV has header and we're 0-indexed
    const rowErrors: ImportError[] = [];

    // Validate race_name (required)
    if (!row.race_name || row.race_name.trim() === '') {
      rowErrors.push({
        rowIndex,
        field: 'race_name',
        code: 'REQUIRED_FIELD',
        message: 'Race name is required',
        hint: 'Please provide a race name'
      });
    } else if (row.race_name.trim().length < 2) {
      rowErrors.push({
        rowIndex,
        field: 'race_name',
        code: 'FIELD_TOO_SHORT',
        message: `Race name too short (${row.race_name.trim().length} chars, min 2)`,
        hint: 'Please provide a race name with at least 2 characters'
      });
    } else if (row.race_name.length > 200) {
      rowErrors.push({
        rowIndex,
        field: 'race_name',
        code: 'FIELD_TOO_LONG',
        message: `Race name too long (${row.race_name.length} chars, max 200)`,
        hint: 'Please shorten the race name'
      });
    }

    // Validate race_date (required)
    if (!row.race_date || row.race_date.trim() === '') {
      rowErrors.push({
        rowIndex,
        field: 'race_date',
        code: 'REQUIRED_FIELD',
        message: 'Race date is required',
        hint: 'Please provide a race date'
      });
    } else {
      // Validate date format
      const date = new Date(row.race_date);
      if (isNaN(date.getTime())) {
        rowErrors.push({
          rowIndex,
          field: 'race_date',
          code: 'INVALID_DATE',
          message: `Invalid date format: ${row.race_date}`,
          hint: 'Please provide a valid date in YYYY-MM-DD format'
        });
      }
    }

    // Validate title (required)
    if (!row.title || row.title.trim() === '') {
      rowErrors.push({
        rowIndex,
        field: 'title',
        code: 'REQUIRED_FIELD',
        message: 'Title is required',
        hint: 'Please provide a report title'
      });
    } else if (row.title.trim().length < 2) {
      rowErrors.push({
        rowIndex,
        field: 'title',
        code: 'FIELD_TOO_SHORT',
        message: `Title too short (${row.title.trim().length} chars, min 2)`,
        hint: 'Please provide a title with at least 2 characters'
      });
    } else if (row.title.length > 200) {
      rowErrors.push({
        rowIndex,
        field: 'title',
        code: 'FIELD_TOO_LONG',
        message: `Title too long (${row.title.length} chars, max 200)`,
        hint: 'Please shorten the title'
      });
    }

    // Validate content_md (required)
    if (!row.content_md || row.content_md.trim() === '') {
      rowErrors.push({
        rowIndex,
        field: 'content_md',
        code: 'REQUIRED_FIELD',
        message: 'Content is required',
        hint: 'Please provide report content'
      });
    } else if (row.content_md.trim().length < 10) {
      rowErrors.push({
        rowIndex,
        field: 'content_md',
        code: 'FIELD_TOO_SHORT',
        message: `Content too short (${row.content_md.trim().length} chars, min 10)`,
        hint: 'Please provide more detailed content'
      });
    }

    // Validate author_name (optional but has length limit)
    if (row.author_name && row.author_name.length > 100) {
      rowErrors.push({
        rowIndex,
        field: 'author_name',
        code: 'FIELD_TOO_LONG',
        message: `Author name too long (${row.author_name.length} chars, max 100)`,
        hint: 'Please shorten the author name'
      });
    }

    // Validate race_id (optional but must be number if provided)
    let raceId: number | null = null;
    if (row.race_id && row.race_id.trim() !== '') {
      const idValue = parseInt(row.race_id.trim());
      if (isNaN(idValue) || idValue <= 0) {
        rowErrors.push({
          rowIndex,
          field: 'race_id',
          code: 'INVALID_ID',
          message: `Invalid race ID '${row.race_id}' - must be a positive number`,
          hint: 'Please provide a valid race ID or leave empty'
        });
      } else {
        raceId = idValue;
        raceIdsToValidate.push(idValue);
        raceIdToRowIndex.set(idValue, rowIndex);
      }
    }

    // Validate ID (optional but must be number if provided)
    let reportId: number | null = null;
    if (row.id && row.id.trim() !== '') {
      const idValue = parseInt(row.id.trim());
      if (isNaN(idValue) || idValue <= 0) {
        rowErrors.push({
          rowIndex,
          field: 'id',
          code: 'INVALID_ID',
          message: `Invalid report ID '${row.id}' - must be a positive number`,
          hint: 'Please provide a valid report ID or leave empty for new report'
        });
      } else {
        reportId = idValue;
        reportIdsToValidate.push(idValue);
        reportIdToRowIndex.set(idValue, rowIndex);
      }
    }

    // Parse photos (optional)
    let photos: string[] | null = null;
    if (row.photos && row.photos.trim() !== '') {
      photos = row.photos.split(',').map(photo => photo.trim()).filter(photo => photo.length > 0);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Transform to RaceReportUpsert
      const reportUpsert: RaceReportUpsert = {
        id: reportId,
        race_id: raceId,
        race_name: row.race_name!.trim(),
        race_date: row.race_date!.trim(),
        title: row.title!.trim(),
        author_name: row.author_name?.trim() || null,
        content_md: row.content_md!.trim(),
        photos
      };
      valid.push(reportUpsert);
    }
  });

  // Validate race report IDs against database if any IDs were provided
  let existingReportIds: number[] = [];
  let missingReportIds: number[] = [];
  
  if (reportIdsToValidate.length > 0) {
    try {
      const token = auth.getToken();
      if (token) {
        const validationResult = await raceReports.validateIds(reportIdsToValidate, token);
        existingReportIds = validationResult.existing_ids || [];
        missingReportIds = validationResult.missing_ids || [];
        
        // Add warnings for missing report IDs
        missingReportIds.forEach(missingId => {
          const rowIndex = reportIdToRowIndex.get(missingId);
          if (rowIndex) {
            warnings.push({
              rowIndex,
              field: 'id',
              code: 'ID_NOT_FOUND',
              message: `Race report ID ${missingId} does not exist in the database`,
              hint: 'This row will be skipped during import since the specified ID cannot be found'
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to validate race report IDs against database:', error);
      // Don't fail validation if ID check fails, just log the warning
    }
  }

  // Validate race IDs against database if any race IDs were provided
  let existingRaceIds: number[] = [];
  let missingRaceIds: number[] = [];
  
  if (raceIdsToValidate.length > 0) {
    try {
      const token = auth.getToken();
      console.log('Race ID validation - Token available:', !!token);
      console.log('Race IDs to validate:', raceIdsToValidate);
      if (token) {
        const { races } = await import('@shared/services/api');
        const validationResult = await races.validateIds(raceIdsToValidate, token);
        console.log('Race ID validation result:', validationResult);
        existingRaceIds = validationResult.existing_ids || [];
        missingRaceIds = validationResult.missing_ids || [];
        
        // Add warnings for missing race IDs
        missingRaceIds.forEach(missingId => {
          const rowIndex = raceIdToRowIndex.get(missingId);
          if (rowIndex) {
            warnings.push({
              rowIndex,
              field: 'race_id',
              code: 'ID_NOT_FOUND',
              message: `Race ID ${missingId} does not exist in the database`,
              hint: 'This row will be skipped during import since the referenced race cannot be found'
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to validate race IDs against database:', error);
      // If validation fails, treat all race IDs as potentially missing and add warnings
      raceIdsToValidate.forEach(raceId => {
        const rowIndex = raceIdToRowIndex.get(raceId);
        if (rowIndex) {
          warnings.push({
            rowIndex,
            field: 'race_id',
            code: 'VALIDATION_FAILED',
            message: `Could not validate race ID ${raceId} - API communication failed`,
            hint: 'This row will be skipped during import. Please check your connection and try again.'
          });
        }
      });
    }
  }

  // Categorize valid rows based on ID status
  valid.forEach(report => {
    if (report.id) {
      if (existingReportIds.includes(report.id)) {
        willUpdate.push(report);
      } else {
        willSkip.push(report);
      }
    } else {
      // For rows without report IDs, check if race_id validation failed
      if (report.race_id && raceIdsToValidate.includes(report.race_id) && missingRaceIds.includes(report.race_id)) {
        // Race ID was validated and found to be missing - skip this row
        willSkip.push(report);
      } else {
        // Either no race_id, or race_id validation succeeded, or validation failed (treat as create)
        willCreate.push(report);
      }
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
