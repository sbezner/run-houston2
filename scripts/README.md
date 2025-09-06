# Database Migration Scripts

This directory contains scripts for managing database migrations.

## Migration Runner

The `migrate.py` script automatically runs database migrations in chronological order.

### Usage

```bash
# Run all pending migrations
python scripts/migrate.py

# Dry run (show what would be executed)
python scripts/migrate.py --dry-run

# Verbose output
python scripts/migrate.py --verbose

# Both dry run and verbose
python scripts/migrate.py --dry-run --verbose
```

### Features

- **Automatic Ordering**: Runs migrations in timestamp order
- **Safety**: Prevents re-running already applied migrations
- **Checksums**: Tracks file checksums for integrity
- **Logging**: Detailed output of what's being executed
- **Error Handling**: Stops on errors and provides clear messages
- **Dry Run**: Test what would be executed without making changes

### Environment Variables

The script uses these environment variables for database connection:

- `DATABASE_URL` (preferred) - Full PostgreSQL connection string
- `POSTGRES_USER` - Database username (default: rh_user)
- `POSTGRES_PASSWORD` - Database password (default: rh_password)
- `POSTGRES_DB` - Database name (default: runhou)
- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database port (default: 5432)

### Migration Files

Migration files should be placed in `infra/initdb/` with the naming pattern:
```
YYYYMMDD_HHMM_description.sql
```

Example: `20250906_0537_create_schema_migrations_table.sql`

### Migration Tracking

The script uses the `schema_migrations` table to track applied migrations:

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);
```

### Example Output

```
🔄 Database Migration Runner
==================================================
✓ Connected to database
Found 5 migration files

📄 Processing: 20250906_0537_create_schema_migrations_table
  Description: Create migration tracking table
  ⏭️  Already applied, skipping

📄 Processing: 20250906_0001_init
  Description: Initial database schema
  🔄 Running migration: 20250906_0001_init
  ✓ Successfully executed: infra/initdb/20250906_0001_init.sql
  ✓ Migration 20250906_0001_init completed

==================================================
📊 Migration Summary
  Applied: 1
  Skipped: 1
  Errors: 0

✅ Migration process completed successfully
```
