# API Versioning Documentation

## Overview

The Run Houston API implements a comprehensive versioning system that ensures backward compatibility and provides clear version information to clients.

## Version Information

### System Release Manifest

The API reads version information from `releases/system-release.json`:

```json
{
  "system_release": "2025.09.R1",
  "api": "1.0.0",
  "db_schema": "20250909_2026_complete_database_schema",
  "web": "1.0.1",
  "mobile": "1.0.0",
  "api_path_major": "v1",
  "compatibility": {
    "min_supported_api_major": 1,
    "deprecation_windows": {}
  }
}
```

### Version Headers

All API responses include the following headers:

- **API-Version**: Current API version (e.g., "1.0.0")
- **API-Path-Major**: API path major version (e.g., "v1")
- **Schema-Version**: Database schema version (e.g., "20250909_2026_complete_database_schema")

## API Endpoints

### GET /api/v1/version

Returns detailed version information for client compatibility checking.

**Response:**
```json
{
  "api_version": "1.0.0",
  "api_path_major": "v1",
  "schema_version": "20250909_2026_complete_database_schema",
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

### GET /health

Enhanced health check endpoint with version information.

**Response:**
```json
{
  "status": "healthy",
  "api_version": "1.0.0",
  "schema_version": "20250909_2026_complete_database_schema",
  "system_release": "2025.09.R1",
  "uptime": "unknown",
  "last_deployment": "unknown"
}
```

## Versioning Strategy

### API Versioning
- **Semantic Versioning (SemVer)**: Major.Minor.Patch (e.g., 1.7.0)
- **Major Version**: Breaking changes, new API path (e.g., /api/v2)
- **Minor Version**: New features, backward compatible
- **Patch Version**: Bug fixes, backward compatible

### Database Schema Versioning
- **Timestamped Versioning**: YYYYMMDD_HHMM format (e.g., 20250906_0537)
- **Migration Tracking**: All schema changes tracked in `schema_migrations` table
- **Rollback Safety**: Migrations marked as rollback-safe when possible

### System Release Versioning
- **CalVer + Release Tag**: YYYY.MM.R# format (e.g., 2025.09.R1)
- **Year.Month.Release**: Quarterly release cycle
- **Release Tag**: R1, R2, etc. for multiple releases in same month

## Client Compatibility

### Version Checking
Clients should check API compatibility on startup:

1. **Fetch Version Info**: GET `/api/v1/version`
2. **Check Compatibility**: Compare API major version with minimum supported
3. **Handle Incompatibility**: Show update prompt or graceful degradation

### Minimum Supported Versions
- **API Major Version**: 1 (current minimum)
- **Mobile App**: 1.0.0+
- **Web App**: 1.0.0+

## Migration System

### Database Migrations
- **Location**: `infra/initdb/` directory
- **Naming**: `YYYYMMDD_HHMM_description.sql`
- **Runner**: `scripts/migrate.py`
- **Tracking**: `schema_migrations` table

### Migration Commands
```bash
# Run all pending migrations
python scripts/migrate.py

# Dry run (show what would be applied)
python scripts/migrate.py --dry-run

# Verbose output
python scripts/migrate.py --verbose
```

## Error Handling

### Version Mismatch
- **HTTP 400**: Client version too old
- **HTTP 426**: API version deprecated
- **HTTP 503**: Service temporarily unavailable

### Graceful Degradation
- **Network Errors**: Allow app to continue with limited functionality
- **Version Errors**: Show user-friendly update prompts
- **API Downtime**: Cache last known good state

## Monitoring

### Version Metrics
- **API Version Usage**: Track which versions are being used
- **Client Versions**: Monitor mobile/web app versions in use
- **Migration Status**: Database migration health
- **Compatibility Alerts**: Version mismatch warnings

### Health Checks
- **API Health**: `/health` endpoint with version info
- **Database Health**: Migration status and connectivity
- **System Health**: Overall system status with version details

## Troubleshooting

### Common Issues

1. **Version Headers Missing**
   - Check `system-release.json` exists and is valid
   - Verify API server is reading the file correctly

2. **Version Endpoint Not Working**
   - Ensure API server is running
   - Check `/api/v1/version` endpoint is accessible

3. **Migration Failures**
   - Check database connectivity
   - Verify migration files are valid SQL
   - Review `schema_migrations` table for conflicts

4. **Client Compatibility Issues**
   - Verify client is checking API version
   - Check minimum supported version requirements
   - Ensure proper error handling for version mismatches

### Debug Information

- **API Version**: Available in response headers and `/api/v1/version`
- **Schema Version**: Available in response headers and health check
- **System Release**: Available in version endpoint and health check
- **Migration Status**: Check `schema_migrations` table

## Best Practices

### For API Development
1. **Increment Versions**: Update version numbers for all changes
2. **Test Compatibility**: Ensure backward compatibility
3. **Document Changes**: Update version documentation
4. **Monitor Usage**: Track version adoption rates

### For Client Development
1. **Check Compatibility**: Always verify API version on startup
2. **Handle Errors**: Graceful degradation for version mismatches
3. **Cache Version Info**: Reduce API calls for version checking
4. **Update Promptly**: Encourage users to update for new features

### For Database Changes
1. **Use Migrations**: Always use migration system for schema changes
2. **Test Rollbacks**: Ensure migrations can be safely rolled back
3. **Document Changes**: Include clear descriptions in migration files
4. **Backup Data**: Always backup before running migrations
