# Version Compatibility Matrix

## Overview

This document defines the compatibility between different versions of Run Houston system components (API, Database Schema, Web Frontend, Mobile App, and System Release).

## Versioning Strategy

### API Versioning (SemVer)
- **Format**: `MAJOR.MINOR.PATCH` (e.g., `1.7.0`)
- **Major**: Breaking changes, new API path (e.g., `/api/v2`)
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Database Schema Versioning (Timestamped)
- **Format**: `YYYYMMDD_HHMM` (e.g., `20250906_0537`)
- **Timestamp**: When the migration was created
- **Compatibility**: Schema versions are generally backward compatible

### System Release Versioning (CalVer + Release Tag)
- **Format**: `YYYY.MM.R#` (e.g., `2025.09.R1`)
- **Year.Month**: Release month
- **Release Tag**: R1, R2, etc. for multiple releases in same month

## Compatibility Matrix

### Current Versions (2025.09.R1)

| Component | Version | API Path | Schema Version | Compatible With |
|-----------|---------|----------|----------------|-----------------|
| **System Release** | 2025.09.R1 | - | - | All components |
| **API** | 1.0.0 | v1 | 20250906_0537 | Web 1.0.0+, Mobile 1.0.0+ |
| **Database Schema** | 20250906_0537 | - | - | API 1.0.0+ |
| **Web Frontend** | 1.0.0 | v1 | 20250906_0537 | API 1.0.0+ |
| **Mobile App** | 1.0.0 | v1 | 20250906_0537 | API 1.0.0+ |

### API Version Compatibility

| API Version | API Path | Min Web | Min Mobile | Schema Versions | Status |
|-------------|----------|---------|------------|-----------------|--------|
| **1.0.0** | v1 | 1.0.0+ | 1.0.0+ | 20250906_0537+ | ✅ Current |
| **0.9.x** | v1 | 0.9.0+ | 0.9.0+ | 20250906_0537+ | ⚠️ Deprecated |
| **0.8.x** | v1 | 0.8.0+ | 0.8.0+ | 20250906_0537+ | ❌ Unsupported |

### Database Schema Compatibility

| Schema Version | API Versions | Web Versions | Mobile Versions | Status |
|----------------|--------------|--------------|-----------------|--------|
| **20250906_0537** | 1.0.0+ | 1.0.0+ | 1.0.0+ | ✅ Current |
| **20250905_1430** | 0.9.0+ | 0.9.0+ | 0.9.0+ | ⚠️ Deprecated |
| **20250904_1200** | 0.8.0+ | 0.8.0+ | 0.8.0+ | ❌ Unsupported |

### Client Compatibility

| Client Type | Version | Min API | Min Schema | Max API | Status |
|-------------|---------|---------|------------|---------|--------|
| **Web Frontend** | 1.0.0 | 1.0.0 | 20250906_0537 | Latest | ✅ Current |
| **Web Frontend** | 0.9.0 | 0.9.0 | 20250905_1430 | 1.0.0 | ⚠️ Deprecated |
| **Mobile App** | 1.0.0 | 1.0.0 | 20250906_0537 | Latest | ✅ Current |
| **Mobile App** | 0.9.0 | 0.9.0 | 20250905_1430 | 1.0.0 | ⚠️ Deprecated |

## Compatibility Rules

### API Compatibility
1. **Major Version**: Breaking changes require new API path (e.g., `/api/v2`)
2. **Minor Version**: New features, backward compatible with same major version
3. **Patch Version**: Bug fixes, backward compatible with same major.minor version

### Database Schema Compatibility
1. **Forward Compatible**: New schema versions support older API versions
2. **Backward Compatible**: Older schema versions may not support newer API versions
3. **Migration Required**: Schema updates require migration to new version

### Client Compatibility
1. **API Version Check**: Clients check API version on startup
2. **Minimum Supported**: Each client has minimum supported API version
3. **Graceful Degradation**: Clients handle version mismatches gracefully

## Version Checking

### API Version Endpoint
```bash
GET /api/v1/version
```

Response:
```json
{
  "api_version": "1.0.0",
  "api_path_major": "v1",
  "schema_version": "20250906_0537",
  "system_release": "2025.09.R1",
  "deprecated": false,
  "sunset_date": null,
  "min_supported_api_major": 1,
  "min_supported_clients": {
    "mobile": "1.0.0+",
    "web": "1.0.0+"
  }
}
```

### Version Headers
All API responses include:
- `API-Version`: Current API version
- `API-Path-Major`: API path major version
- `Schema-Version`: Database schema version

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "api_version": "1.0.0",
  "schema_version": "20250906_0537",
  "system_release": "2025.09.R1"
}
```

## Upgrade Paths

### API Upgrades
1. **Minor Version**: Update API version, no client changes required
2. **Major Version**: Update API version, create new API path, update clients

### Database Upgrades
1. **Schema Migration**: Run migration script to update schema
2. **API Update**: Update API to use new schema features
3. **Client Update**: Update clients to use new API features

### Client Upgrades
1. **Version Check**: Client checks API compatibility on startup
2. **Update Prompt**: Show update prompt if version incompatible
3. **Graceful Degradation**: Continue with limited functionality if possible

## Deprecation Policy

### API Deprecation
1. **Deprecation Notice**: Mark API version as deprecated
2. **Sunset Date**: Set end-of-life date for deprecated version
3. **Migration Period**: Provide time for clients to upgrade
4. **Removal**: Remove deprecated version after sunset date

### Client Deprecation
1. **Version Check**: Clients check for deprecation status
2. **Update Prompt**: Show deprecation warning to users
3. **Graceful Degradation**: Reduce functionality for deprecated clients
4. **Force Update**: Require update for critical security fixes

## Testing Compatibility

### Compatibility Tests
- **API Version Tests**: Test API version endpoints and headers
- **Client Version Tests**: Test client version checking
- **Schema Version Tests**: Test database schema compatibility
- **Integration Tests**: Test full system compatibility

### Test Commands
```bash
# Run version compatibility tests
python tests/025_run_version_migration_tests.py

# Run all backend tests
python tests/run_all_backend_tests.py

# Run all tests
python tests/run_all_tests_combined.py
```

## Monitoring

### Version Metrics
- **API Version Usage**: Track which API versions are being used
- **Client Versions**: Monitor mobile/web app versions in use
- **Schema Versions**: Track database schema versions in production
- **Compatibility Issues**: Monitor version mismatch errors

### Alerts
- **Version Mismatch**: Alert when clients use incompatible versions
- **Deprecation Warnings**: Alert when deprecated versions are used
- **Migration Failures**: Alert when database migrations fail
- **API Downtime**: Alert when API is unavailable

## Troubleshooting

### Common Issues

#### Version Mismatch
**Problem**: Client version incompatible with API version
**Solution**: Update client to compatible version or update API

#### Schema Mismatch
**Problem**: API version incompatible with database schema
**Solution**: Run database migration or update API version

#### Deprecated Version
**Problem**: Client using deprecated API version
**Solution**: Update client to supported version

#### Migration Failure
**Problem**: Database migration fails
**Solution**: Check migration file, restore from backup, fix issues

### Debug Information
- **API Version**: Available in `/api/v1/version` endpoint
- **Schema Version**: Available in health check and version headers
- **Client Version**: Available in client about screens
- **System Release**: Available in version endpoint and health check

## Future Compatibility

### Planned Versions
- **API 1.1.0**: New features, backward compatible
- **API 2.0.0**: Breaking changes, new API path `/api/v2`
- **Schema 20250920_1000**: New features, backward compatible
- **System Release 2025.10.R1**: Next quarterly release

### Compatibility Guarantees
- **API v1**: Supported until 2026.09.R1
- **Schema 20250906_0537**: Supported until 2026.09.R1
- **Web 1.0.0**: Supported until API v1 is deprecated
- **Mobile 1.0.0**: Supported until API v1 is deprecated

## Conclusion

This compatibility matrix ensures that all Run Houston system components work together seamlessly while providing clear upgrade paths and deprecation policies. Regular updates to this matrix ensure accurate compatibility information for all stakeholders.
