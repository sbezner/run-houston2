#!/usr/bin/env python3
"""
Database Migration Runner for Run Houston

This script automatically runs database migrations in chronological order.
It uses the schema_migrations table to track which migrations have been applied
and prevents re-running migrations for safety.

Usage:
    python scripts/migrate.py --env <dev|prod> [--dry-run] [--verbose]

Options:
    --env        Environment: 'dev' for local Docker, 'prod' for production
    --dry-run    Show what would be run without executing
    --verbose    Show detailed output
"""

import os
import sys
import glob
import psycopg
import hashlib
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def get_database_connection(env: str):
    """Get database connection based on environment."""
    if env == "dev":
        return LocalDockerConnection()
    elif env == "prod":
        return ProductionConnection()
    else:
        raise ValueError(f"Invalid environment: {env}. Must be 'dev' or 'prod'")

class LocalDockerConnection:
    """Connection handler for local Docker environment."""
    
    def execute_sql(self, sql: str, dry_run: bool = False) -> bool:
        """Execute SQL against local Docker database."""
        if dry_run:
            print(f"🔍 [DRY RUN] Would execute: {sql[:100]}...")
            return True
        
        cmd = [
            'docker', 'exec', 'runhou_db',
            'psql', '-U', 'rh_user', '-d', 'runhou',
            '-c', sql
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ SQL execution failed: {e.stderr}")
            return False
        except subprocess.TimeoutExpired:
            print(f"⏰ SQL execution timed out after 30 seconds")
            return False
        except FileNotFoundError:
            print("❌ Docker not found. Make sure Docker is installed and running.")
            return False
    
    def query_sql(self, sql: str) -> list:
        """Query SQL and return results."""
        cmd = [
            'docker', 'exec', 'runhou_db',
            'psql', '-U', 'rh_user', '-d', 'runhou',
            '-t', '-A', '-F', '|', '-c', sql
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=10)
            lines = result.stdout.strip().split('\n')
            return [line.split('|') for line in lines if line.strip()]
        except:
            return []

class ProductionConnection:
    """Connection handler for production environment."""
    
    def __init__(self):
        self.conn = None
        self.connect()
    
    def connect(self):
        """Connect to production database."""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            # Fallback to individual environment variables
            postgres_user = os.getenv("POSTGRES_USER", "rh_user")
            postgres_password = os.getenv("POSTGRES_PASSWORD", "rh_password")
            postgres_db = os.getenv("POSTGRES_DB", "runhou")
            postgres_host = os.getenv("POSTGRES_HOST", "localhost")
            postgres_port = os.getenv("POSTGRES_PORT", "5432")
            
            database_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
        
        try:
            self.conn = psycopg.connect(database_url)
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    
    def execute_sql(self, sql: str, dry_run: bool = False) -> bool:
        """Execute SQL against production database."""
        if dry_run:
            print(f"🔍 [DRY RUN] Would execute: {sql[:100]}...")
            return True
        
        try:
            with self.conn.cursor() as cur:
                cur.execute(sql)
                self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ SQL execution failed: {e}")
            return False
    
    def query_sql(self, sql: str) -> list:
        """Query SQL and return results."""
        try:
            with self.conn.cursor() as cur:
                cur.execute(sql)
                return cur.fetchall()
        except:
            return []
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

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
    if hasattr(conn, 'query_sql'):
        # New connection class
        results = conn.query_sql(f"SELECT version FROM schema_migrations WHERE version = '{version}'")
        return len(results) > 0
    else:
        # Legacy psycopg connection
        with conn.cursor() as cur:
            cur.execute("SELECT version FROM schema_migrations WHERE version = %s", (version,))
            return cur.fetchone() is not None

def record_migration(conn, version, file_path, description=None):
    """Record a migration as applied."""
    checksum = calculate_checksum(file_path)
    
    if hasattr(conn, 'execute_sql'):
        # New connection class
        sql = f"INSERT INTO schema_migrations (version, description, checksum, applied_at) VALUES ('{version}', '{description or ''}', '{checksum}', NOW())"
        return conn.execute_sql(sql)
    else:
        # Legacy psycopg connection
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO schema_migrations (version, description, checksum, applied_at)
                VALUES (%s, %s, %s, NOW())
            """, (version, description, checksum))
            conn.commit()
        return True

def run_sql_file(conn, file_path, dry_run=False, verbose=False):
    """Execute a SQL file."""
    if verbose:
        print(f"  Executing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        if hasattr(conn, 'execute_sql'):
            # New connection class
            success = conn.execute_sql(sql_content, dry_run)
            if success and verbose and not dry_run:
                print(f"  ✓ Successfully executed: {file_path}")
            return success
        else:
            # Legacy psycopg connection
            if dry_run:
                print(f"  [DRY RUN] Would execute: {file_path}")
                return True
            
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

def run_migrations(env, dry_run=False, verbose=False):
    """Run all pending migrations."""
    print("🔄 Database Migration Runner")
    print("=" * 50)
    
    if env == "dev":
        print("🏠 Local Development Environment (Docker)")
    elif env == "prod":
        print("🚀 Production Environment")
    
    # Get database connection
    try:
        conn = get_database_connection(env)
        if verbose:
            print(f"Connecting to database...")
        
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
    finally:
        # Clean up connection if it's a production connection
        if env == "prod" and 'conn' in locals() and hasattr(conn, 'close'):
            conn.close()

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run database migrations")
    parser.add_argument("--env", required=True, choices=["dev", "prod"], 
                       help="Environment: 'dev' for local Docker, 'prod' for production")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be run without executing")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    success = run_migrations(args.env, args.dry_run, args.verbose)
    
    if success:
        print("\n✅ Migration process completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Migration process failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
