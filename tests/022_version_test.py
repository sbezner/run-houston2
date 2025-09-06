#!/usr/bin/env python3
"""
Version System Tests

This test suite verifies that all versioning functionality works correctly:
- API version headers
- Version endpoints
- Health check version info
- System release manifest
- Migration tracking

Run with: python -m pytest tests/022_version_test.py -v
"""

import pytest
import json
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import the API app
from api.app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

class TestVersionHeaders:
    """Test that version headers are added to all API responses."""
    
    def test_races_endpoint_has_version_headers(self):
        """Test that /races endpoint includes version headers."""
        # Use real HTTP request to test the actual running API
        import requests
        
        try:
            response = requests.get("http://localhost:8000/races", timeout=5)
            
            # Check that version headers are present
            assert "API-Version" in response.headers
            assert "API-Path-Major" in response.headers
            assert "Schema-Version" in response.headers
            
            # Check header values
            assert response.headers["API-Version"] == "1.0.0"
            assert response.headers["API-Path-Major"] == "v1"
            assert response.headers["Schema-Version"] == "20250906_0537"
            
            # Also verify the endpoint returns 200 OK
            assert response.status_code == 200
            
        except requests.exceptions.ConnectionError:
            pytest.skip("API server not running - start with 'python ss.py'")
        except Exception as e:
            pytest.fail(f"Unexpected error testing /races endpoint: {e}")
    
    def test_health_endpoint_has_version_headers(self):
        """Test that /health endpoint includes version headers."""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert "API-Version" in response.headers
        assert "API-Path-Major" in response.headers
        assert "Schema-Version" in response.headers
    
    def test_version_endpoint_has_version_headers(self):
        """Test that /api/v1/version endpoint includes version headers."""
        response = client.get("/api/v1/version")
        
        assert response.status_code == 200
        assert "API-Version" in response.headers
        assert "API-Path-Major" in response.headers
        assert "Schema-Version" in response.headers

class TestVersionEndpoint:
    """Test the /api/v1/version endpoint functionality."""
    
    def test_version_endpoint_returns_correct_structure(self):
        """Test that version endpoint returns expected JSON structure."""
        response = client.get("/api/v1/version")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "api_version" in data
        assert "api_path_major" in data
        assert "schema_version" in data
        assert "system_release" in data
        assert "deprecated" in data
        assert "sunset_date" in data
        assert "min_supported_api_major" in data
        assert "min_supported_clients" in data
    
    def test_version_endpoint_returns_correct_values(self):
        """Test that version endpoint returns correct values."""
        response = client.get("/api/v1/version")
        data = response.json()
        
        assert data["api_version"] == "1.0.0"
        assert data["api_path_major"] == "v1"
        assert data["schema_version"] == "20250906_0537"
        assert data["system_release"] == "2025.09.R1"
        assert data["deprecated"] == False
        assert data["sunset_date"] is None
        assert data["min_supported_api_major"] == 1
        assert "mobile" in data["min_supported_clients"]
        assert "web" in data["min_supported_clients"]
    
    def test_version_endpoint_client_compatibility(self):
        """Test that version endpoint includes client compatibility info."""
        response = client.get("/api/v1/version")
        data = response.json()
        
        clients = data["min_supported_clients"]
        assert clients["mobile"] == "1.0.0+"
        assert clients["web"] == "1.0.0+"

class TestHealthCheckVersion:
    """Test that health check includes version information."""
    
    def test_health_check_includes_version_info(self):
        """Test that health check returns version information."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "status" in data
        assert "api_version" in data
        assert "schema_version" in data
        assert "system_release" in data
        assert "uptime_seconds" in data
        assert "last_deployment" in data
    
    def test_health_check_version_values(self):
        """Test that health check returns correct version values."""
        response = client.get("/health")
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["api_version"] == "1.0.0"
        assert data["schema_version"] == "20250906_0537"
        assert data["system_release"] == "2025.09.R1"
        assert data["uptime_seconds"] >= 0
        assert data["last_deployment"] is None

class TestSystemReleaseManifest:
    """Test the system release manifest functionality."""
    
    def test_system_release_manifest_exists(self):
        """Test that system release manifest file exists."""
        manifest_path = project_root / "releases" / "system-release.json"
        assert manifest_path.exists(), "System release manifest should exist"
    
    def test_system_release_manifest_valid_json(self):
        """Test that system release manifest contains valid JSON."""
        manifest_path = project_root / "releases" / "system-release.json"
        
        with open(manifest_path, 'r') as f:
            data = json.load(f)
        
        # Check required fields
        assert "system_release" in data
        assert "api" in data
        assert "db_schema" in data
        assert "web" in data
        assert "mobile" in data
        assert "api_path_major" in data
        assert "compatibility" in data
    
    def test_system_release_manifest_values(self):
        """Test that system release manifest contains correct values."""
        manifest_path = project_root / "releases" / "system-release.json"
        
        with open(manifest_path, 'r') as f:
            data = json.load(f)
        
        assert data["system_release"] == "2025.09.R1"
        assert data["api"] == "1.0.0"
        assert data["db_schema"] == "20250906_0537"
        assert data["web"] == "1.0.0"
        assert data["mobile"] == "1.0.0"
        assert data["api_path_major"] == "v1"
        assert data["compatibility"]["min_supported_api_major"] == 1

class TestMigrationTracking:
    """Test migration tracking functionality."""
    
    def test_migration_table_migration_exists(self):
        """Test that migration tracking table migration exists."""
        migration_path = project_root / "infra" / "initdb" / "20250906_0537_create_schema_migrations_table.sql"
        assert migration_path.exists(), "Migration tracking table migration should exist"
    
    def test_migration_runner_exists(self):
        """Test that migration runner script exists."""
        runner_path = project_root / "scripts" / "migrate.py"
        assert runner_path.exists(), "Migration runner script should exist"
    
    def test_migration_runner_executable(self):
        """Test that migration runner script is executable."""
        runner_path = project_root / "scripts" / "migrate.py"
        assert os.access(runner_path, os.X_OK), "Migration runner should be executable"

class TestWebFrontendVersioning:
    """Test web frontend versioning functionality."""
    
    def test_web_config_exists(self):
        """Test that web frontend config exists."""
        config_path = project_root / "web" / "src" / "config.ts"
        assert config_path.exists(), "Web frontend config should exist"
    
    def test_web_config_contains_version_constants(self):
        """Test that web config contains version constants."""
        config_path = project_root / "web" / "src" / "config.ts"
        
        with open(config_path, 'r') as f:
            content = f.read()
        
        assert "APP_VERSION" in content
        assert "BUILD_HASH" in content
        assert "BUILD_DATE" in content
        assert "API_PATH" in content
    
    def test_web_about_page_has_version_display(self):
        """Test that web about page has version display."""
        about_path = project_root / "web" / "src" / "pages" / "AboutPage.tsx"
        assert about_path.exists(), "Web about page should exist"
        
        with open(about_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert "VersionDisplay" in content
        assert "versionInfo" in content
        assert "api_version" in content

class TestMobileAppVersioning:
    """Test mobile app versioning functionality."""
    
    def test_mobile_version_constants_exist(self):
        """Test that mobile version constants exist."""
        version_path = project_root / "mobile" / "src" / "constants" / "version.ts"
        assert version_path.exists(), "Mobile version constants should exist"
    
    def test_mobile_version_constants_content(self):
        """Test that mobile version constants contain required values."""
        version_path = project_root / "mobile" / "src" / "constants" / "version.ts"
        
        with open(version_path, 'r') as f:
            content = f.read()
        
        assert "APP_VERSION" in content
        assert "DB_VERSION" in content
        assert "MIN_SUPPORTED_API_MAJOR" in content
        assert "API_PATH" in content
        assert "isApiCompatible" in content
    
    def test_mobile_app_has_version_check(self):
        """Test that mobile app has version checking logic."""
        app_path = project_root / "mobile" / "App.tsx"
        assert app_path.exists(), "Mobile app should exist"
        
        with open(app_path, 'r') as f:
            content = f.read()
        
        assert "checkApiCompatibility" in content
        assert "VERSION" in content
        assert "isApiCompatible" in content
    
    def test_mobile_about_screen_has_version_display(self):
        """Test that mobile about screen has version display."""
        about_path = project_root / "mobile" / "src" / "components" / "AboutScreen.tsx"
        assert about_path.exists(), "Mobile about screen should exist"
        
        with open(about_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert "System Information" in content
        assert "versionInfo" in content
        assert "apiVersionInfo" in content

class TestVersionConsistency:
    """Test that version information is consistent across components."""
    
    def test_api_version_consistency(self):
        """Test that API version is consistent between endpoints and manifest."""
        # Get version from endpoint
        response = client.get("/api/v1/version")
        endpoint_data = response.json()
        
        # Get version from manifest
        manifest_path = project_root / "releases" / "system-release.json"
        with open(manifest_path, 'r') as f:
            manifest_data = json.load(f)
        
        # Check consistency
        assert endpoint_data["api_version"] == manifest_data["api"]
        assert endpoint_data["schema_version"] == manifest_data["db_schema"]
        assert endpoint_data["system_release"] == manifest_data["system_release"]
    
    def test_headers_consistency(self):
        """Test that version headers are consistent across endpoints."""
        # Test endpoints that don't require database connection
        endpoints = ["/health", "/api/v1/version"]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200
            
            # All endpoints should have the same version headers
            assert response.headers["API-Version"] == "1.0.0"
            assert response.headers["API-Path-Major"] == "v1"
            assert response.headers["Schema-Version"] == "20250906_0537"

if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v"])
