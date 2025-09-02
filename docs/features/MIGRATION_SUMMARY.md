# Migration Summary: Run Houston Database Migrations

## Migration 1: Remove Unnecessary Fields from Races Table

### Overview
This migration removes the following unnecessary fields from the `races` table:
- `price_min` (NUMERIC)
- `price_max` (NUMERIC) 
- `registration_url` (TEXT)
- `source` (TEXT, default: 'manual')

## Files Modified

### 1. New Migration File
- **Created**: `infra/initdb/004_remove_unnecessary_fields.sql`
- **Purpose**: Drops the specified columns from existing databases
- **Rollback**: Includes commented rollback statements for easy reversal

### 2. Updated Schema File
- **Modified**: `infra/initdb/001_init.sql`
- **Changes**: 
  - Removed field definitions from CREATE TABLE statement
  - Updated INSERT statements to exclude removed fields
  - Removed sample data values for deleted fields

## Migration Details

### Forward Migration (Apply)
```sql
-- Run this to apply the migration:
\i infra/initdb/004_remove_unnecessary_fields.sql
```

### Rollback Migration (If needed)
```sql
-- Uncomment and run these lines to rollback:
-- ALTER TABLE races ADD COLUMN price_min NUMERIC;
-- ALTER TABLE races ADD COLUMN price_max NUMERIC;
-- ALTER TABLE races ADD COLUMN registration_url TEXT;
-- ALTER TABLE races ADD COLUMN source TEXT DEFAULT 'manual';
```

## Impact Analysis

### ✅ No Impact On:
- **API Endpoints**: All existing endpoints continue to work unchanged
- **Frontend Code**: No references to removed fields found in web/mobile apps
- **Database Queries**: All SELECT/INSERT/UPDATE statements already exclude these fields
- **Data Integrity**: No foreign key constraints or dependencies on removed fields

### 🔄 What Changed:
- **Database Schema**: Table structure simplified by removing unused columns
- **Initial Data**: Sample race data no longer includes price or registration information
- **Future Deployments**: New database instances will have the cleaner schema

## Verification Steps

1. **Apply Migration**: Run the migration file against your database
2. **Verify Schema**: Confirm columns are removed:
   ```sql
   \d races
   ```
3. **Test API**: Ensure all race endpoints continue to function
4. **Check Data**: Verify existing race records are intact

## Notes

- This migration uses `DROP COLUMN IF EXISTS` for safety
- The migration is idempotent and can be run multiple times safely
- No data migration was needed as these fields were not actively used
- All existing race data remains intact after the migration

---

## Migration 2: Add Geom Trigger and Lat/Lon Guard Constraint

### Overview
This migration adds automatic geom population from coordinates, backfills existing rows, and enforces coordinate consistency:
- **Auto-populate `races.geom`** from `latitude` and `longitude` on INSERT/UPDATE
- **Backfill existing rows** where coordinates exist but geom is NULL
- **Enforce constraint** that lat/lon must be both set or both NULL
- **Enable spatial queries** using PostGIS geography functions

### Files Modified

#### 1. New Migration File
- **Created**: `infra/initdb/005_geom_trigger.sql`
- **Purpose**: Creates trigger function, adds trigger, backfills data, adds constraint
- **Rollback**: Includes commented rollback statements for easy reversal

### Migration Details

#### Forward Migration (Apply)
```sql
-- Run this to apply the migration:
\i infra/initdb/005_geom_trigger.sql
```

#### Rollback Migration (If needed)
```sql
-- Uncomment and run these lines to rollback:

-- Remove guard constraint
ALTER TABLE races
  DROP CONSTRAINT IF EXISTS races_latlon_pair;

-- Remove trigger
DROP TRIGGER IF EXISTS races_set_geom ON races;

-- Remove function
DROP FUNCTION IF EXISTS set_race_geom();

-- Optional: clear geom if desired
-- UPDATE races SET geom = NULL;
```

### What Changed

#### ✅ New Functionality:
- **Trigger Function**: `set_race_geom()` automatically sets geom from coordinates
- **Database Trigger**: Fires on INSERT and when lat/lon columns change
- **Guard Constraint**: `races_latlon_pair` ensures coordinate consistency
- **Backfill**: Existing rows with coordinates get geom populated

#### 🔄 Database Schema:
- **Function**: `set_race_geom()` in public schema
- **Trigger**: `races_set_geom` on races table
- **Constraint**: `races_latlon_pair` CHECK constraint
- **Data**: All existing coordinate pairs now have geom values

### Verification Steps

#### 1. Apply Migration
```bash
psql -d <DB_NAME> -f infra/initdb/005_geom_trigger.sql
```

#### 2. Test Trigger on Insert
```sql
INSERT INTO races (name, date, surface, latitude, longitude)
VALUES ('Trigger Test 5K', '2025-10-01', 'road', 29.7604, -95.3698);

SELECT name, latitude, longitude, ST_AsText(geom)
FROM races WHERE name = 'Trigger Test 5K';
```

#### 3. Test Trigger on Update
```sql
UPDATE races SET latitude = 29.75, longitude = -95.36
WHERE name = 'Trigger Test 5K';

SELECT name, ST_AsText(geom) FROM races WHERE name = 'Trigger Test 5K';
```

#### 4. Test Guard Constraint
```sql
-- This should fail (only one coordinate set):
INSERT INTO races (name, date, surface, latitude) 
VALUES ('Bad Row', '2025-11-02', 'road', 30.0);

-- This should succeed (both NULL):
INSERT INTO races (name, date, surface) 
VALUES ('No Coords', '2025-11-03', 'road');
```

#### 5. Verify Backfill
```sql
-- Check that all coordinate pairs have geom values
SELECT COUNT(*) as total_races,
       COUNT(geom) as with_geom,
       COUNT(*) - COUNT(geom) as without_geom
FROM races;
```

#### 6. Quick Smoke Test (Recommended)
For rapid validation, run the automated smoke test:
```bash
psql -d <DB_NAME> -f infra/tests/001_geom_smoke_test.sql
```

This test script:
- ✅ Tests geom auto-population on INSERT with coordinates
- ✅ Tests geom remains NULL when coordinates are NULL  
- ✅ Tests geom updates when coordinates change
- ✅ Tests guard constraint rejects partial coordinates
- ✅ Tests both NULL coordinates are allowed
- ✅ Cleans up test data automatically
- ✅ Provides clear PASS/FAIL results in under 60 seconds

### Impact Analysis

#### ✅ No Impact On:
- **API Endpoints**: All existing endpoints continue to work unchanged
- **Frontend Code**: No changes required in web/mobile apps
- **Data Integrity**: Existing race data remains intact
- **Performance**: Trigger overhead is minimal for small dataset

#### 🔄 What Changed:
- **Automatic Geom**: Coordinates now automatically populate geom field
- **Data Consistency**: Guard constraint prevents orphaned coordinates
- **Spatial Queries**: Can now use PostGIS functions on geom column
- **Backfill**: Existing coordinate data now has corresponding geom values

### Notes

- **Idempotent**: Migration can be run multiple times safely
- **PostGIS Required**: Extension must be enabled (already done in 001_init.sql)
- **Constraint Name**: Stable name `races_latlon_pair` for future reference
- **No Indexes**: Intentionally omitted for this small dataset
- **Rollback Safe**: Previous geom values remain unless explicitly cleared

---

## Migration 3: Expand Surface Constraint

### Overview
This migration expands the allowed surface values for races from the original `('road', 'trail')` to a more comprehensive set:
- **Expanded Values**: `('road', 'trail', 'track', 'virtual', 'other')`
- **Maintains TEXT Type**: No schema changes to column type
- **CHECK Constraint**: Enforces allowed values at database level
- **Backward Compatible**: Existing 'road' and 'trail' values remain valid

### Files Modified

#### 1. New Migration File
- **Created**: `infra/initdb/006_expand_surface_constraint.sql`
- **Purpose**: Replaces existing surface constraint with expanded version
- **Rollback**: Includes commented rollback statements for easy reversal

#### 2. Updated Schema File
- **Modified**: `infra/initdb/001_init.sql`
- **Changes**: Updated CREATE TABLE statement with expanded surface constraint

### Migration Details

#### Forward Migration (Apply)
```sql
-- Run this to apply the migration:
\i infra/initdb/006_expand_surface_constraint.sql
```

#### Rollback Migration (If needed)
```sql
-- Remove expanded constraint
ALTER TABLE races DROP CONSTRAINT IF EXISTS surface_check;

-- Restore original constraint (if needed)
ALTER TABLE races ADD CONSTRAINT surface_check CHECK (surface IN ('road','trail'));
```

### Allowed Surface Values

#### ✅ Valid Surface Types:
- **`'road'`**: Traditional paved surface races (5Ks, 10Ks, marathons)
- **`'trail'`**: Off-road, natural surface races (trail runs, cross-country)
- **`'track'`**: Running track/oval races (track meets, indoor races)
- **`'virtual'`**: Virtual/online races (Strava challenges, virtual events)
- **`'other'** : Miscellaneous or unique race surfaces

#### ❌ Invalid Examples:
- `'grass'` - Not in allowed list
- `'beach'` - Not in allowed list  
- `'mountain'` - Not in allowed list
- `'asphalt'` - Not in allowed list

### Verification Steps

#### 1. Apply Migration
```bash
psql -d <DB_NAME> -f infra/initdb/006_expand_surface_constraint.sql
```

#### 2. Test Valid Surface Values
```sql
-- These should all succeed:
INSERT INTO races (name, date, surface) VALUES ('Road Race', '2025-02-01', 'road');
INSERT INTO races (name, date, surface) VALUES ('Trail Run', '2025-02-02', 'trail');
INSERT INTO races (name, date, surface) VALUES ('Track Meet', '2025-02-03', 'track');
INSERT INTO races (name, date, surface) VALUES ('Virtual Race', '2025-02-04', 'virtual');
INSERT INTO races (name, date, surface) VALUES ('Unique Race', '2025-02-05', 'other');
```

#### 3. Test Invalid Surface Values
```sql
-- These should all fail:
INSERT INTO races (name, date, surface) VALUES ('Invalid Race', '2025-02-06', 'grass');
INSERT INTO races (name, date, surface) VALUES ('Invalid Race', '2025-02-07', 'beach');
INSERT INTO races (name, date, surface) VALUES ('Invalid Race', '2025-02-08', 'mountain');
```

#### 4. Verify Constraint
```sql
-- Check that constraint is active:
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'races'::regclass AND conname = 'surface_check';
```

### Impact Analysis

#### ✅ No Impact On:
- **Existing Data**: All current 'road' and 'trail' races remain valid
- **API Endpoints**: No changes required in existing endpoints
- **Frontend Code**: No changes required in web/mobile apps
- **Performance**: CHECK constraint has minimal overhead

#### 🔄 What Changed:
- **Constraint**: Surface validation now allows 5 values instead of 2
- **Data Entry**: Users can now specify more race surface types
- **Validation**: Database enforces expanded set of allowed values

### Future Extensions

#### Adding New Surface Types
To add more surface types in the future:

1. **Create New Migration**:
```sql
-- Example: Adding 'beach' and 'mountain'
ALTER TABLE races 
  DROP CONSTRAINT IF EXISTS surface_check,
  ADD CONSTRAINT surface_check 
  CHECK (surface IN ('road', 'trail', 'track', 'virtual', 'other', 'beach', 'mountain'));
```

2. **Update Schema File**: Modify `001_init.sql` to include new values
3. **Update Tests**: Add test cases for new surface types
4. **Update Documentation**: Reflect new allowed values

#### Best Practices for Extensions:
- **Use Migration Files**: Always create numbered migration files
- **Include Rollback**: Provide clear rollback instructions
- **Test Thoroughly**: Validate both new and existing values
- **Update Schema**: Keep `001_init.sql` in sync with migrations
- **Document Changes**: Update this summary document

### Notes

- **Idempotent**: Migration can be run multiple times safely
- **Constraint Name**: Uses `surface_check` for consistency
- **TEXT Type Maintained**: No changes to column data type
- **No Lookup Table**: Keeps design simple and performant
- **Rollback Ready**: Easy to revert to previous constraint if needed
