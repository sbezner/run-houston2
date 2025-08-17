# CSV Import System

This directory contains the modular CSV import system for the Run Houston admin dashboard.

## Overview

The CSV import system provides a robust, 3-step wizard for importing race data with comprehensive validation, error handling, and batch processing capabilities.

## Architecture

### Core Modules

- **`errors.ts`** - Type definitions and error handling
- **`parseCsv.ts`** - CSV parsing with Papa Parse
- **`validation.ts`** - Data validation and transformation
- **`download.ts`** - Error export functionality

### Import Flow

1. **Select + Parse** - File selection and CSV parsing
2. **Validate + Preview** - Data validation with preview and error display
3. **Commit** - Batch import with progress tracking and cancellation

## Features

### Robust Validation
- **Required fields**: name, date, start_time, city, state, surface, kid_run
- **Date formats**: MM/DD/YYYY, MMM-DD-YY, YYYY-MM-DD
- **Time formats**: HH:mm, HH:mm:ss, h:mm AM/PM
- **Surface types**: road, trail, track, mixed
- **Boolean parsing**: TRUE/FALSE, Yes/No, Y/N, 1/0
- **URL normalization**: Auto-prefix https:// for domains
- **Coordinate validation**: Latitude [-90, 90], Longitude [-180, 180]

### Error Handling
- **Row-level errors** with specific field validation
- **Helpful hints** for fixing common issues
- **Error export** to CSV for analysis
- **Duplicate detection** with warnings

### Batch Processing
- **Batch size**: 100 races per batch
- **Concurrency**: 3 concurrent requests
- **Progress tracking** with real-time updates
- **Cancellation support** via AbortController
- **Retry logic** for failed requests

## CSV Format

### Required Columns
```
name, date, start_time, city, state, surface, kid_run
```

### Optional Columns
```
id, address, zip, official_website_url, latitude, longitude
```

### Example Data
```csv
id,name,date,start_time,address,city,state,zip,surface,kid_run,official_website_url,latitude,longitude
1,Bayou City 5k,8/19/2025,19:30:00,600 Memorial Dr,Houston,tx,77007,road,FALSE,https://runsignup.com/Race/TX/Houston/BayouCityClassic10k,29.7633,-95.3819
2,Galveston Beach 10K,9/1/2025,8:00 AM,Stewart Beach,Galveston,TX,77550,road,No,https://example.com/galv10k,29.3,-94.7667
```

## Usage

### In AdminDashboard Component

```typescript
import { parseCsvFile } from './import/parseCsv';
import { validateAndTransform } from './import/validation';
import { downloadErrorsCsv } from './import/download';

// Parse CSV file
const result = await parseCsvFile(csvFile);

// Validate and transform data
const validation = validateAndTransform(result.rows);

// Download errors if any
downloadErrorsCsv(validation.errors);
```

### State Management

```typescript
const [importState, setImportState] = useState<'idle' | 'parsed' | 'validated' | 'committing' | 'done' | 'error'>('idle');
const [rawRows, setRawRows] = useState<RaceCsvRow[]>([]);
const [previewRows, setPreviewRows] = useState<RaceUpsert[]>([]);
const [importErrors, setImportErrors] = useState<ImportError[]>([]);
const [importWarnings, setImportWarnings] = useState<ImportError[]>([]);
const [commitProgress, setCommitProgress] = useState({ total: 0, done: 0, succeeded: 0, failed: 0 });
```

## Error Codes

- **REQUIRED** - Missing required field
- **INVALID_DATE** - Unparseable date format
- **INVALID_TIME** - Unparseable time format
- **INVALID_URL** - Invalid URL format
- **OUT_OF_RANGE** - Value outside valid range
- **HEADER_MISSING** - Required CSV header missing
- **DUPLICATE** - Duplicate race detected
- **PARSE_ERROR** - General parsing error
- **INCONSISTENT_COORDS** - Missing or mismatched coordinates

## Testing

Run the validation test to verify functionality:

```bash
cd web/src/import
npx ts-node validation.test.ts
```

## Dependencies

- **papaparse** - CSV parsing
- **zod** - Schema validation
- **React** - UI components and state management
