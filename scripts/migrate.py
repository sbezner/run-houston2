#!/usr/bin/env python3
"""
Database Migration Runner for Run Houston

This script automatically runs database migrations in chronological order.
It uses the schema_migrations table to track which migrations have been applied
and prevents re-running migrations for safety.

Usage:
    python scripts/migrate.py [--dry-run] [--verbose]

Options:
    --dry-run    Show what would be run without executing
    --verbose    Show detailed output
"""

import os
import sys
import glob
import psycopg
import hashlib
import argparse
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def get_database_url():
    """Get database URL from environment variables."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Fallback to individual environment variables
        postgres_user = os.getenv("POSTGRES_USER", "rh_user")
        postgres_password = os.getenv("POSTGRES_PASSWORD", "rh_password")
        postgres_db = os.getenv("POSTGRES_DB", "runhou")
        postgres_host = os.getenv("POSTGRES_HOST", "localhost")
        postgres_port = os.getenv("POSTGRES_PORT", "5432")
        
        database_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
    
    return database_url

def get_migration_files():
    """Get all migration files in chronological order."""
    migration_dir = project_root / "infra" / "initdb"
    pattern = str(migration_dir / "20*.sql")
    files = glob.glob(pattern)
    return sorted(files)

def calculate_checksum(file_path):
    """Calculate SHA-256 checksum of a file."""
    with open(file_path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

def migration_applied(conn, version):
    """Check if a migration has already been applied."""
    with conn.cursor() as cur:
        cur.execute("SELECT version FROM schema_migrations WHERE version = %s", (version,))
        return cur.fetchone() is not None

def record_migration(conn, version, file_path, description=None):
    """Record a migration as applied."""
    checksum = calculate_checksum(file_path)
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO schema_migrations (version, description, checksum, applied_at)
            VALUES (%s, %s, %s, NOW())
        """, (version, description, checksum))
        conn.commit()

def run_sql_file(conn, file_path, dry_run=False, verbose=False):
    """Execute a SQL file."""
    if verbose:
        print(f"  Executing: {file_path}")
    
    if dry_run:
        print(f"  [DRY RUN] Would execute: {file_path}")
        return True
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        with conn.cursor() as cur:
            cur.execute(sql_content)
            conn.commit()
        
        if verbose:
            print(f"  ✓ Successfully executed: {file_path}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error executing {file_path}: {e}")
        return False

def get_migration_description(file_path):
    """Extract description from migration file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if first_line.startswith('-- Migration:'):
                return first_line.replace('-- Migration:', '').strip()
    except:
        pass
    return os.path.basename(file_path)

def run_migrations(dry_run=False, verbose=False):
    """Run all pending migrations."""
    print("🔄 Database Migration Runner")
    print("=" * 50)
    
    # Get database connection
    try:
        database_url = get_database_url()
        if verbose:
            print(f"Connecting to database...")
        
        with psycopg.connect(database_url) as conn:
            print("✓ Connected to database")
            
            # Get all migration files
            migration_files = get_migration_files()
            if not migration_files:
                print("No migration files found in infra/initdb/")
                return True
            
            print(f"Found {len(migration_files)} migration files")
            
            # Process each migration
            applied_count = 0
            skipped_count = 0
            error_count = 0
            
            for file_path in migration_files:
                version = os.path.basename(file_path).replace('.sql', '')
                description = get_migration_description(file_path)
                
                if verbose:
                    print(f"\n📄 Processing: {version}")
                    print(f"  Description: {description}")
                
                # Check if already applied
                if migration_applied(conn, version):
                    if verbose:
                        print(f"  ⏭️  Already applied, skipping")
                    skipped_count += 1
                    continue
                
                # Run the migration
                print(f"  🔄 Running migration: {version}")
                success = run_sql_file(conn, file_path, dry_run, verbose)
                
                if success:
                    if not dry_run:
                        record_migration(conn, version, file_path, description)
                    applied_count += 1
                    print(f"  ✓ Migration {version} completed")
                else:
                    error_count += 1
                    print(f"  ✗ Migration {version} failed")
                    if not dry_run:
                        print("  Stopping migration process due to error")
                        return False
            
            # Summary
            print("\n" + "=" * 50)
            print("📊 Migration Summary")
            print(f"  Applied: {applied_count}")
            print(f"  Skipped: {skipped_count}")
            print(f"  Errors: {error_count}")
            
            if dry_run:
                print("  [DRY RUN] No changes were made")
            
            return error_count == 0
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run database migrations")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be run without executing")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    success = run_migrations(args.dry_run, args.verbose)
    
    if success:
        print("\n✅ Migration process completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Migration process failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
