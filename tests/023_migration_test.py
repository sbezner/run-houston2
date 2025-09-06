#!/usr/bin/env python3
"""
Migration System Tests

This test suite verifies that the migration system works correctly:
- Migration runner functionality
- Migration tracking
- File discovery and ordering
- Error handling

Run with: python -m pytest tests/023_migration_test.py -v
"""

import pytest
import os
import sys
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import the migration runner
sys.path.insert(0, str(project_root / "scripts"))
from migrate import (
    get_migration_files,
    calculate_checksum,
    migration_applied,
    record_migration,
    get_migration_description,
    run_sql_file
)

class TestMigrationFileDiscovery:
    """Test migration file discovery and ordering."""
    
    def test_get_migration_files_returns_sorted_list(self):
        """Test that migration files are returned in chronological order."""
        files = get_migration_files()
        
        # Should be sorted by filename (which includes timestamp)
        assert files == sorted(files)
        
        # Should only include .sql files with timestamp pattern
        for file_path in files:
            assert file_path.endswith('.sql')
            filename = os.path.basename(file_path)
            assert filename.startswith('20')  # Should start with year
            assert len(filename.split('_')) >= 2  # Should have timestamp format
    
    def test_get_migration_files_finds_existing_migrations(self):
        """Test that existing migration files are found."""
        files = get_migration_files()
        
        # Should find the migration tracking table migration
        migration_tracking_found = any('20250906_0537_create_schema_migrations_table' in f for f in files)
        assert migration_tracking_found, "Should find the migration tracking table migration"

class TestMigrationUtilities:
    """Test migration utility functions."""
    
    def test_calculate_checksum(self):
        """Test checksum calculation."""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.sql') as f:
            f.write("-- Test migration\nCREATE TABLE test (id INT);")
            temp_file = f.name
        
        try:
            checksum = calculate_checksum(temp_file)
            assert len(checksum) == 64  # SHA-256 should be 64 characters
            assert checksum.isalnum()  # Should be alphanumeric
        finally:
            os.unlink(temp_file)
    
    def test_get_migration_description(self):
        """Test migration description extraction."""
        # Test with proper comment format
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.sql') as f:
            f.write("-- Migration: Create test table\nCREATE TABLE test (id INT);")
            temp_file = f.name
        
        try:
            description = get_migration_description(temp_file)
            assert description == "Create test table"
        finally:
            os.unlink(temp_file)
    
    def test_get_migration_description_fallback(self):
        """Test migration description fallback to filename."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.sql') as f:
            f.write("CREATE TABLE test (id INT);")  # No comment
            temp_file = f.name
        
        try:
            description = get_migration_description(temp_file)
            assert description == os.path.basename(temp_file)
        finally:
            os.unlink(temp_file)

class TestMigrationRunner:
    """Test migration runner functionality."""
    
    def test_migration_runner_script_exists(self):
        """Test that migration runner script exists and is executable."""
        runner_path = project_root / "scripts" / "migrate.py"
        assert runner_path.exists(), "Migration runner should exist"
        assert os.access(runner_path, os.X_OK), "Migration runner should be executable"
    
    def test_migration_runner_has_help(self):
        """Test that migration runner has help functionality."""
        runner_path = project_root / "scripts" / "migrate.py"
        
        # Test that script can be imported and has main function
        import importlib.util
        spec = importlib.util.spec_from_file_location("migrate", runner_path)
        migrate_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migrate_module)
        
        assert hasattr(migrate_module, 'main'), "Migration runner should have main function"
        assert hasattr(migrate_module, 'run_migrations'), "Migration runner should have run_migrations function"
    
    def test_migration_runner_dry_run_mode(self):
        """Test that migration runner supports dry run mode."""
        runner_path = project_root / "scripts" / "migrate.py"
        
        # Test that script can be imported and has argument parsing
        import importlib.util
        spec = importlib.util.spec_from_file_location("migrate", runner_path)
        migrate_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migrate_module)
        
        # Check that argparse is used
        with open(runner_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert "--dry-run" in content, "Migration runner should support dry run mode"
        assert "--verbose" in content, "Migration runner should support verbose mode"

class TestMigrationTracking:
    """Test migration tracking functionality."""
    
    def test_migration_tracking_table_migration_exists(self):
        """Test that migration tracking table migration exists."""
        migration_path = project_root / "infra" / "initdb" / "20250906_0537_create_schema_migrations_table.sql"
        assert migration_path.exists(), "Migration tracking table migration should exist"
    
    def test_migration_tracking_table_sql_content(self):
        """Test that migration tracking table SQL is correct."""
        migration_path = project_root / "infra" / "initdb" / "20250906_0537_create_schema_migrations_table.sql"
        
        with open(migration_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check that it creates the schema_migrations table
        assert "CREATE TABLE IF NOT EXISTS schema_migrations" in content
        assert "version VARCHAR(255) PRIMARY KEY" in content
        assert "applied_at TIMESTAMP" in content
        assert "description TEXT" in content
        assert "checksum VARCHAR(255)" in content
        assert "rollback_safe BOOLEAN" in content
        
        # Check that it creates an index
        assert "CREATE INDEX" in content
        
        # Check that it records itself
        assert "INSERT INTO schema_migrations" in content
        assert "20250906_0537_create_schema_migrations_table" in content

class TestMigrationSafety:
    """Test migration safety features."""
    
    def test_migration_files_have_timestamp_naming(self):
        """Test that migration files follow timestamp naming convention."""
        migration_dir = project_root / "infra" / "initdb"
        
        for file_path in migration_dir.glob("20*.sql"):
            filename = file_path.name
            # Should match pattern: YYYYMMDD_HHMM_description.sql
            parts = filename.replace('.sql', '').split('_')
            assert len(parts) >= 2, f"Migration file {filename} should have timestamp format"
            
            # First part should be date (YYYYMMDD)
            date_part = parts[0]
            assert len(date_part) == 8, f"Date part in {filename} should be 8 digits"
            assert date_part.isdigit(), f"Date part in {filename} should be numeric"
            
            # Second part should be time (HHMM)
            time_part = parts[1]
            assert len(time_part) == 4, f"Time part in {filename} should be 4 digits"
            assert time_part.isdigit(), f"Time part in {filename} should be numeric"
    
    def test_migration_files_are_sql_files(self):
        """Test that all migration files are SQL files."""
        migration_dir = project_root / "infra" / "initdb"
        
        for file_path in migration_dir.glob("20*.sql"):
            assert file_path.suffix == '.sql', f"Migration file {file_path} should be .sql"
    
    def test_migration_files_have_descriptions(self):
        """Test that migration files have proper descriptions."""
        migration_dir = project_root / "infra" / "initdb"
        
        for file_path in migration_dir.glob("20*.sql"):
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                # Skip the old init file that doesn't follow the new format
                if file_path.name == "20250906_0001_init.sql":
                    continue
                assert first_line.startswith('-- Migration:'), f"Migration file {file_path} should start with -- Migration: comment"

class TestMigrationDocumentation:
    """Test migration documentation and help."""
    
    def test_migration_readme_exists(self):
        """Test that migration README exists."""
        readme_path = project_root / "scripts" / "README.md"
        assert readme_path.exists(), "Migration README should exist"
    
    def test_migration_readme_content(self):
        """Test that migration README contains useful information."""
        readme_path = project_root / "scripts" / "README.md"
        
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for key sections
        assert "Usage" in content
        assert "Features" in content
        assert "Environment Variables" in content
        assert "Migration Files" in content
        assert "Migration Tracking" in content
        assert "Example Output" in content

if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v"])
