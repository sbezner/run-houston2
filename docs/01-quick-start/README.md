# 🚀 Quick Start Guide

Welcome to Run Houston! This section will get you up and running quickly.

## 📚 Documentation Overview

### 🏠 [Local Development Setup](./LOCAL_SETUP.md)
Complete local development environment setup:
- Prerequisites and system requirements
- Database setup with Docker
- API service configuration
- Frontend development setup
- Mobile development environment

### 🐳 [Docker Quickstart](./DOCKER_QUICKSTART.md)
Docker-based development setup:
- Docker Compose configuration
- Multi-service development environment
- Hot-reload development workflow
- Database initialization

### 📱 [Mobile Development](./MOBILE_DEVELOPMENT.md)
React Native mobile app development:
- Expo development setup
- Mobile app configuration
- Testing and debugging
- Build and deployment

## 🎯 Getting Started

### For New Developers
1. **Start Here**: [Local Development Setup](./LOCAL_SETUP.md)
2. **Choose Your Path**: Docker or local installation
3. **Verify Setup**: Run the test suite
4. **Start Coding**: Begin with the API or frontend

### For Quick Testing
1. **Docker Setup**: [Docker Quickstart](./DOCKER_QUICKSTART.md)
2. **Run Tests**: Verify everything works
3. **Explore**: Check out the API endpoints

### For Mobile Development
1. **Mobile Setup**: [Mobile Development](./MOBILE_DEVELOPMENT.md)
2. **Expo CLI**: Install and configure
3. **Test App**: Run on device or simulator

## 🔧 System Requirements

### Development Environment
- **Node.js**: 18.x or later
- **Python**: 3.11 or later
- **Docker**: Latest version (optional)
- **Git**: Latest version

### Mobile Development
- **Expo CLI**: Latest version
- **React Native**: Compatible with Expo
- **iOS Simulator**: Xcode (macOS only)
- **Android Emulator**: Android Studio

### Database
- **PostgreSQL**: 14 or later
- **PostGIS**: 3.x extension
- **Docker**: For containerized setup

## 🚀 Quick Commands

### Start Development Environment
```bash
# Using Docker (recommended)
docker-compose up -d

# Local setup
python api/app/main.py
npm run dev  # In web directory
```

### Run Tests
```bash
# All tests
python tests/run_all_tests_combined.py

# Backend only
python tests/run_all_backend_tests.py

# Frontend only
npm test  # In web directory
```

### Database Setup
```bash
# Run migrations
python scripts/migrate.py --env dev --verbose

# Check database
docker exec runhou_db psql -U rh_user -d runhou -c "\dt"
```

## 📞 Need Help?

### Common Issues
- **Database Connection**: Check Docker is running
- **Port Conflicts**: Ensure ports 5432, 8000, 5173 are free
- **Dependencies**: Run `npm install` and `pip install -r requirements.txt`

### Documentation
- **API Documentation**: Available at http://localhost:8000/docs
- **System Architecture**: See [Architecture Documentation](../02-architecture/README.md)
- **Deployment**: See [Deployment Guide](../03-deployment/README.md)

### Support
- **Issues**: Create an issue in the repository
- **Questions**: Check existing documentation first
- **Bugs**: Report in [Known Issues](../10-issues/KNOWN_ISSUES.md)

---

**Last Updated**: 2025-01-15  
**Quick Start Status**: Ready  
**Next Step**: Choose your development path above
