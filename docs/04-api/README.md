# 🔌 API Documentation

This section contains comprehensive API documentation for the Run Houston backend service.

## 📚 Documentation Overview

### 🏷️ [Versioning](./VERSIONING.md)
API versioning strategy and compatibility:
- Semantic versioning (SemVer)
- Version endpoints and headers
- Backward compatibility guarantees
- Deprecation policies
- Client version checking

## 🎯 API Overview

The Run Houston API is a RESTful service built with FastAPI that provides:

- **Race Management**: CRUD operations for races and race reports
- **Club Management**: Club verification and management
- **Spatial Queries**: Geographic data with PostGIS
- **Authentication**: JWT-based admin authentication
- **Data Import/Export**: CSV file processing

## 🔧 Key Features

### Authentication
- JWT-based authentication for admin access
- Secure password hashing with bcrypt
- Token expiration and refresh
- Role-based access control

### Spatial Data
- PostGIS integration for geographic queries
- Automatic geometry generation from lat/lng
- Spatial indexing for performance
- Distance and area calculations

### Data Validation
- Pydantic models for request validation
- Comprehensive error handling
- Input sanitization and security
- Response validation

### Versioning
- API version headers in all responses
- Version endpoint for client checking
- Backward compatibility guarantees
- Deprecation warnings

## 📊 API Endpoints

### Health and Version
- `GET /health` - System health check
- `GET /api/v1/version` - API version information

### Authentication
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/auth/logout` - Admin logout
- `GET /api/v1/auth/me` - Current user info

### Races
- `GET /api/v1/races` - List races
- `POST /api/v1/races` - Create race
- `GET /api/v1/races/{id}` - Get race details
- `PUT /api/v1/races/{id}` - Update race
- `DELETE /api/v1/races/{id}` - Delete race

### Race Reports
- `GET /api/v1/race-reports` - List race reports
- `POST /api/v1/race-reports` - Create race report
- `GET /api/v1/race-reports/{id}` - Get race report
- `PUT /api/v1/race-reports/{id}` - Update race report
- `DELETE /api/v1/race-reports/{id}` - Delete race report

### Clubs
- `GET /api/v1/clubs` - List clubs
- `POST /api/v1/clubs` - Create club
- `GET /api/v1/clubs/{id}` - Get club details
- `PUT /api/v1/clubs/{id}` - Update club
- `DELETE /api/v1/clubs/{id}` - Delete club

### Data Import/Export
- `POST /api/v1/import/csv` - Import CSV data
- `GET /api/v1/export/csv` - Export CSV data

## 🔒 Security

### Authentication
- JWT tokens with expiration
- Secure password hashing
- Admin-only access for write operations
- Rate limiting and request validation

### CORS Configuration
- Production domains only
- No wildcard origins
- Preflight request handling
- Secure headers

### Input Validation
- Pydantic model validation
- SQL injection prevention
- XSS protection
- Request size limits

## 📈 Performance

### Optimization
- Database query optimization
- Spatial indexing for geographic queries
- Response compression
- Connection pooling

### Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Request logging

## 🧪 Testing

### Test Coverage
- Unit tests for all endpoints
- Integration tests with database
- Authentication flow testing
- Error handling validation

### Test Commands
```bash
# Run API tests
python tests/run_all_backend_tests.py

# Run specific API tests
python tests/003_clubs_api_test.py
```

## 📚 API Documentation

### Interactive Documentation
- Swagger UI available at `/docs`
- OpenAPI specification at `/openapi.json`
- ReDoc documentation at `/redoc`

### Response Format
All API responses include:
- Standard HTTP status codes
- Version headers (`API-Version`, `Schema-Version`)
- Consistent JSON structure
- Error details for failures

### Example Response
```json
{
  "data": {...},
  "status": "success",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🔄 Version Compatibility

### Current Version: v1.0.0
- Stable API with backward compatibility
- No breaking changes planned
- 6-month deprecation notice for changes
- Client version checking supported

### Version Headers
All responses include:
- `API-Version`: 1.0.0
- `API-Path-Major`: v1
- `Schema-Version`: 20250909_2026_complete_database_schema

---

**Last Updated**: 2025-01-15  
**API Version**: 1.0.0  
**Status**: Production Ready
