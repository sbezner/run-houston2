# Database Migration Guide

## Overview

The Run Houston system uses a comprehensive database migration system to safely evolve the database schema while maintaining data integrity and providing rollback capabilities.

## Migration System

### Architecture
- **Migration Files**: SQL files in `infra/initdb/` directory
- **Naming Convention**: `YYYYMMDD_HHMM_description.sql`
- **Tracking Table**: `schema_migrations` table
- **Migration Runner**: `scripts/migrate.py` Python script

### Migration Table Structure
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);
```

## Running Migrations

### Basic Usage

```bash
# Run all pending migrations
python scripts/migrate.py

# Dry run (show what would be applied)
python scripts/migrate.py --dry-run

# Verbose output
python scripts/migrate.py --verbose

# Help
python scripts/migrate.py --help
```

### Migration Process

1. **Discovery**: Script finds all `.sql` files in `infra/initdb/`
2. **Ordering**: Files sorted by timestamp in filename
3. **Checking**: Verifies which migrations have been applied
4. **Validation**: Checks file integrity with checksums
5. **Application**: Runs pending migrations in order
6. **Tracking**: Records applied migrations in `schema_migrations` table

## Creating Migrations

### File Naming
- **Format**: `YYYYMMDD_HHMM_description.sql`
- **Example**: `20250906_0537_create_schema_migrations_table.sql`
- **Timestamp**: Use current date/time when creating migration

### File Structure
```sql
-- Migration: 20250906_0537_create_schema_migrations_table
-- Description: Create migration tracking table
-- Rollback Safe: true

-- Your SQL changes here
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);

-- Self-record this migration
INSERT INTO schema_migrations (version, description, rollback_safe)
VALUES ('20250906_0537_create_schema_migrations_table', 'Create migration tracking table', true)
ON CONFLICT (version) DO NOTHING;
```

### Required Comments
Each migration file must include:
- **Migration**: Timestamp and description
- **Description**: What this migration does
- **Rollback Safe**: Whether this migration can be safely rolled back

## Migration Safety

### Rollback Safety
- **true**: Migration can be safely rolled back without data loss
- **false**: Migration cannot be rolled back (use with caution)

### Safe Operations
- Creating new tables
- Adding nullable columns
- Creating indexes
- Adding constraints that don't conflict with existing data

### Unsafe Operations
- Dropping columns
- Changing column types
- Adding non-nullable columns without defaults
- Dropping tables

## Best Practices

### Before Creating Migrations
1. **Backup Database**: Always backup before making changes
2. **Test Locally**: Test migration on development database first
3. **Review Changes**: Have another developer review the migration
4. **Document Changes**: Include clear description and rollback safety

### Migration Design
1. **Idempotent**: Migrations should be safe to run multiple times
2. **Atomic**: Each migration should be a complete, logical change
3. **Reversible**: Design with rollback in mind when possible
4. **Tested**: Test both forward and backward migration paths

### Production Deployment
1. **Staged Deployment**: Test in staging environment first
2. **Maintenance Window**: Run migrations during low-traffic periods
3. **Monitoring**: Watch for errors during migration
4. **Rollback Plan**: Have rollback plan ready if issues occur

## Troubleshooting

### Common Issues

#### Migration Already Applied
```
Error: Migration 20250906_0537_create_schema_migrations_table already applied
```
**Solution**: Check `schema_migrations` table to see if migration was already run.

#### Checksum Mismatch
```
Error: Checksum mismatch for migration 20250906_0537_create_schema_migrations_table
```
**Solution**: File was modified after being applied. Restore original file or manually update checksum.

#### Database Connection Error
```
Error: Could not connect to database
```
**Solution**: Check database is running and connection parameters are correct.

#### SQL Syntax Error
```
Error: SQL syntax error in migration file
```
**Solution**: Check SQL syntax and test with database client first.

### Recovery Procedures

#### Manual Migration Tracking
If migration tracking gets out of sync:

```sql
-- Check current migration status
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Manually add migration record
INSERT INTO schema_migrations (version, description, rollback_safe)
VALUES ('20250906_0537_create_schema_migrations_table', 'Create migration tracking table', true);
```

#### Rollback Migration
If you need to rollback a migration:

1. **Check Rollback Safety**:
   ```sql
   SELECT version, rollback_safe FROM schema_migrations WHERE version = 'migration_name';
   ```

2. **Create Rollback Script**: Write SQL to undo the changes

3. **Apply Rollback**: Run the rollback SQL manually

4. **Update Tracking**: Remove or mark migration as rolled back

## Monitoring

### Migration Status
Check migration status:
```sql
SELECT 
    version,
    description,
    applied_at,
    rollback_safe,
    checksum
FROM schema_migrations 
ORDER BY applied_at;
```

### Health Checks
The API health endpoint includes schema version:
```bash
curl http://localhost:8000/health
```

Response includes:
```json
{
  "status": "healthy",
  "schema_version": "20250906_0537",
  "system_release": "2025.09.R1"
}
```

## Environment-Specific Considerations

### Development
- **Frequent Migrations**: Safe to run migrations frequently
- **Test Data**: Can reset database and re-run all migrations
- **Debugging**: Use verbose mode for detailed output

### Staging
- **Production-like**: Test migrations in staging before production
- **Data Volume**: Use realistic data volumes for testing
- **Performance**: Monitor migration performance

### Production
- **Maintenance Windows**: Run during scheduled maintenance
- **Backup First**: Always backup before running migrations
- **Rollback Ready**: Have rollback plan prepared
- **Monitoring**: Watch for errors and performance issues

## Integration with CI/CD

### Automated Migrations
Migrations can be integrated into deployment pipelines:

```yaml
# Example CI/CD step
- name: Run Database Migrations
  run: |
    python scripts/migrate.py --verbose
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Pre-deployment Checks
- **Migration Validation**: Check for pending migrations
- **Compatibility**: Verify API and database versions match
- **Health Checks**: Ensure system is healthy after migration

## Security Considerations

### Database Access
- **Limited Permissions**: Migration runner should have minimal required permissions
- **Connection Security**: Use secure connection strings
- **Audit Logging**: Log all migration activities

### File Integrity
- **Checksums**: Verify migration file integrity
- **Source Control**: Keep migrations in version control
- **Access Control**: Limit who can create and modify migrations

## Performance Considerations

### Large Migrations
- **Batch Processing**: Process large datasets in batches
- **Index Management**: Drop indexes before large data changes, recreate after
- **Lock Management**: Minimize table locks during migration

### Migration Timing
- **Off-peak Hours**: Run migrations during low-traffic periods
- **Estimated Duration**: Estimate migration time and plan accordingly
- **Monitoring**: Watch for performance impact during migration

## Conclusion

The migration system provides a robust, safe way to evolve the database schema while maintaining data integrity and providing rollback capabilities. Follow these guidelines to ensure smooth, reliable database migrations in all environments.
