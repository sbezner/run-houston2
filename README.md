# 🏃‍♂️ Run Houston

A comprehensive race discovery platform for the Houston running community, featuring a mobile app, web frontend, and robust backend API with full system versioning.

## 🎯 Overview

Run Houston helps runners discover and participate in races throughout the Houston area. The platform consists of:

- **Mobile App**: React Native/Expo app for race discovery and management
- **Web Frontend**: React/TypeScript admin dashboard and marketing site
- **Backend API**: FastAPI-based REST API with comprehensive versioning
- **Database**: PostgreSQL with automated migration system

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for web and mobile development)
- Python 3.9+ (for API development)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd run-houston
   ```

2. **Start the database**:
   ```bash
   cd infra
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```bash
   python scripts/migrate.py
   ```

4. **Start the API**:
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Start the web frontend**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

6. **Start the mobile app**:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

## 📊 System Versioning

Run Houston implements a comprehensive versioning system across all components:

### Version Information
- **System Release**: `2025.09.R1` (CalVer + Release Tag)
- **API Version**: `1.0.0` (Semantic Versioning)
- **Database Schema**: `20250906_0537` (Timestamped)
- **Web Frontend**: `1.0.0` (Semantic Versioning)
- **Mobile App**: `1.0.0` (Semantic Versioning)

### Version Endpoints
- **API Version**: `GET /api/v1/version`
- **Health Check**: `GET /health`
- **Version Headers**: All API responses include version headers

### Migration System
- **Migration Runner**: `scripts/migrate.py`
- **Migration Files**: `infra/initdb/` directory
- **Tracking**: `schema_migrations` table

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Web Frontend   │    │   Backend API   │
│   (React Native)│    │    (React)      │    │    (FastAPI)    │
│   Version 1.0.0 │    │   Version 1.0.0 │    │   Version 1.0.0 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │ Schema 20250906 │
                    │     _0537       │
                    └─────────────────┘
```

### Version Coordination

All components are coordinated through `releases/system-release.json`:

```json
{
  "system_release": "2025.09.R1",
  "api": "1.0.0",
  "db_schema": "20250906_0537",
  "web": "1.0.0",
  "mobile": "1.0.0",
  "api_path_major": "v1"
}
```

## 📁 Project Structure

```
run-houston/
├── api/                    # Backend API (FastAPI)
│   ├── app/
│   │   ├── main.py        # Main API application
│   │   ├── models.py      # Database models
│   │   └── auth.py        # Authentication
│   └── requirements.txt   # Python dependencies
├── web/                   # Web Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── config.ts      # Configuration
│   └── package.json       # Node dependencies
├── mobile/                # Mobile App (React Native/Expo)
│   ├── src/
│   │   ├── components/    # React Native components
│   │   ├── screens/       # Screen components
│   │   └── constants/     # Constants and version info
│   └── package.json       # Node dependencies
├── infra/                 # Infrastructure
│   ├── docker-compose.yml # Docker configuration
│   └── initdb/            # Database migrations
├── scripts/               # Utility scripts
│   ├── migrate.py         # Database migration runner
│   └── README.md          # Script documentation
├── tests/                 # Test suites
│   ├── run_all_tests_combined.py
│   └── run_version_migration_tests.py
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   ├── deployment/        # Deployment guides
│   └── architecture/      # System architecture
└── releases/              # Version information
    └── system-release.json
```

## 🔧 Development

### Running Tests

```bash
# Run all tests
python tests/run_all_tests_combined.py

# Run backend tests only
python tests/run_all_backend_tests.py

# Run version/migration tests
python tests/run_version_migration_tests.py

# Run web frontend tests
cd web && npm test

# Run mobile app tests
cd mobile && npm test
```

### Database Management

```bash
# Run migrations
python scripts/migrate.py

# Dry run (show what would be applied)
python scripts/migrate.py --dry-run

# Verbose output
python scripts/migrate.py --verbose
```

### Environment Variables

#### API
```bash
DATABASE_URL=postgresql://rh_user:rh_password@localhost:5432/runhou
```

#### Web Frontend
```bash
VITE_API_BASE=http://localhost:8000
VITE_APP_VERSION=1.0.0
VITE_BUILD_HASH=abc123
VITE_BUILD_DATE=2025-09-06T10:37:00Z
```

#### Mobile App
```bash
EXPO_PUBLIC_API_BASE=http://192.168.7.228:8000
```

## 📚 Documentation

### API Documentation
- [API Versioning Guide](docs/api/API_VERSIONING.md)
- [Migration Guide](docs/deployment/MIGRATION_GUIDE.md)
- [Version Compatibility Matrix](docs/deployment/VERSION_COMPATIBILITY_MATRIX.md)

### Component Documentation
- [Web Frontend README](web/README.md)
- [Mobile App README](mobile/README.md)
- [Scripts README](scripts/README.md)

### Architecture Documentation
- [Complete System Versioning Architecture](docs/architecture/COMPLETE_SYSTEM_VERSIONING_ARCHITECTURE.md)

## 🚀 Deployment

### Production Deployment

1. **Update System Release**:
   ```bash
   # Edit releases/system-release.json
   # Update version numbers for new release
   ```

2. **Run Database Migrations**:
   ```bash
   python scripts/migrate.py --verbose
   ```

3. **Deploy API**:
   ```bash
   # Deploy to your API hosting platform
   # Ensure system-release.json is accessible
   ```

4. **Deploy Web Frontend**:
   ```bash
   cd web
   npm run build
   # Deploy dist/ directory
   ```

5. **Deploy Mobile App**:
   ```bash
   cd mobile
   npx expo build
   # Deploy to app stores
   ```

### Version Management

- **System Release**: Update `releases/system-release.json`
- **API Version**: Update in `releases/system-release.json`
- **Database Schema**: Create new migration files
- **Client Versions**: Update in respective config files

## 🔍 Monitoring

### Health Checks
- **API Health**: `GET /health`
- **Version Info**: `GET /api/v1/version`
- **Database Status**: Check migration status

### Version Monitoring
- **API Version Usage**: Track which versions are being used
- **Client Versions**: Monitor mobile/web app versions
- **Schema Versions**: Track database schema versions
- **Compatibility Issues**: Monitor version mismatches

## 🛠️ Troubleshooting

### Common Issues

1. **Version Mismatch**: Check API and client versions
2. **Migration Failures**: Check database connectivity and migration files
3. **API Downtime**: Check API server status and logs
4. **Client Issues**: Check version compatibility and network connectivity

### Debug Information

- **API Version**: Available in `/api/v1/version` endpoint
- **Schema Version**: Available in health check and version headers
- **Client Versions**: Available in about screens
- **System Release**: Available in version endpoint

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run tests**: `python tests/run_all_tests_combined.py`
5. **Update documentation**
6. **Submit a pull request**

### Development Guidelines

- **Version Updates**: Update version numbers for all changes
- **Migration Safety**: Ensure database migrations are safe and reversible
- **Test Coverage**: Maintain high test coverage
- **Documentation**: Update documentation for all changes

## 📄 License

This project is part of the Run Houston platform. See individual component licenses for details.

## 🏃‍♂️ Support

For support and questions:
- **Documentation**: Check the docs/ directory
- **Issues**: Create an issue in the repository
- **Version Info**: Check `/api/v1/version` endpoint

---

**Built with ❤️ for the Houston running community**
