# 🚀 Run Houston - Production Deployment Guide

## 📋 Executive Summary 

**Current Status**: Environment variables migrated ✅ | **Production Readiness**: 85% | **Target Platform**: Render.com

This document outlines the complete production deployment strategy for Run Houston, a full-stack running race management platform with PostgreSQL/PostGIS backend, FastAPI service, React frontend, and React Native mobile app.

### 🏷️ Version Information
- **Database Schema**: v1.0.0 (PostGIS 3.3)
- **API Service**: v1.0.0 (FastAPI 0.111.0)
- **Web Frontend**: v1.0.0 (React 18.3.1)
- **Mobile App**: v1.0.0 (React Native/Expo)
- **Target Deployment**: 2025-09-05

---

## 🏷️ Version Management Strategy

### Version Control & Release Management
- [ ] **Semantic Versioning (SemVer)**
  - **Format**: `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
  - **MAJOR**: Breaking changes, incompatible API changes
  - **MINOR**: New features, backward compatible
  - **PATCH**: Bug fixes, backward compatible

- [ ] **Component Versioning**
  ```yaml
  Database Schema:
    Current: v1.0.0
    Migration Strategy: Sequential versioning
    Rollback: Schema version downgrade scripts
    
  API Service:
    Current: v1.0.0
    Version Header: X-API-Version
    Deprecation: 6-month notice for breaking changes
    
  Web Frontend:
    Current: v1.0.0
    Build Version: VITE_APP_VERSION
    Cache Busting: Automatic with build hash
    
  Mobile App:
    Current: v1.0.0
    App Store: Semantic versioning
    OTA Updates: Expo updates for non-native changes
  ```

- [ ] **Release Process**
  - [ ] **Pre-Release**: Alpha/Beta testing with version tags
  - [ ] **Release Candidate**: RC1, RC2, etc. for final testing
  - [ ] **Production Release**: Stable version with full documentation
  - [ ] **Hotfix**: Emergency patches (1.0.1, 1.0.2, etc.)

### Database Versioning
- [ ] **Schema Versioning**
  - [ ] Create `schema_migrations` table
  - [ ] Track applied migrations with timestamps
  - [ ] Implement rollback scripts for each migration
  - [ ] Version control for all SQL schema changes

- [ ] **Migration Strategy**
  ```sql
  -- Example migration tracking
  CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
  );
  ```

### API Versioning
- [ ] **API Version Strategy**
  - [ ] URL versioning: `/api/v1/races`, `/api/v2/races`
  - [ ] Header versioning: `Accept: application/vnd.runhouston.v1+json`
  - [ ] Backward compatibility for at least 2 major versions
  - [ ] Deprecation warnings in response headers

- [ ] **API Documentation Versioning**
  - [ ] OpenAPI/Swagger docs per version
  - [ ] Changelog for each API version
  - [ ] Migration guides for breaking changes

### Frontend Versioning
- [ ] **Build Versioning**
  - [ ] Git commit hash in build
  - [ ] Build timestamp for cache busting
  - [ ] Feature flags for gradual rollouts
  - [ ] A/B testing infrastructure

- [ ] **Deployment Versioning**
  - [ ] Blue-green deployments
  - [ ] Canary releases for critical updates
  - [ ] Rollback capability within 5 minutes

### Mobile App Versioning
- [ ] **App Store Versioning**
  - [ ] Semantic versioning for app stores
  - [ ] Build numbers for internal tracking
  - [ ] Version compatibility matrix
  - [ ] Force update mechanism for critical fixes

- [ ] **OTA Update Strategy**
  - [ ] Expo updates for JavaScript changes
  - [ ] Native updates for native code changes
  - [ ] Gradual rollout (10% → 50% → 100%)
  - [ ] Emergency rollback capability

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Frontend  │    │   Admin Panel   │
│  (React Native) │    │    (React)      │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │     (FastAPI + CORS)      │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   PostgreSQL Database     │
                    │   (PostGIS + Spatial)     │
                    └───────────────────────────┘
```

---

## ✅ COMPLETED - Foundation & Security

### 🔐 Security Hardening
- [x] **Environment Variable Migration**
  - ✅ Removed all hard-coded credentials
  - ✅ Admin password: `pencil` → `@RunHouston9339`
  - ✅ JWT secret rotation implemented
  - ✅ Database credentials externalized
  - ✅ All test files updated for env var loading

### 🧪 Quality Assurance
- [x] **Comprehensive Testing Suite**
  - ✅ 125+ tests passing (Backend + Frontend + Mobile)
  - ✅ PostGIS spatial functionality validated
  - ✅ CSV import/export workflows tested
  - ✅ Authentication & authorization tested
  - ✅ Cross-platform compatibility verified

### 🐳 Containerization
- [x] **Docker Development Environment**
  - ✅ Multi-service Docker Compose setup
  - ✅ PostgreSQL with PostGIS extensions
  - ✅ Hot-reload development workflow
  - ✅ Health checks and dependency management

## 🚀 PRODUCTION DEPLOYMENT - Render.com

### Phase 1: Database Infrastructure (HIGH PRIORITY)

#### 🗄️ Managed PostgreSQL Database
- [ ] **Create Render PostgreSQL Service**
  - **Service Type**: Managed PostgreSQL
  - **Plan**: Starter ($7/month) → Production ($25/month)
  - **Extensions**: PostGIS, PostGIS Topology, PostGIS SFCGAL
  - **Backup**: Automated daily backups
  - **Monitoring**: Built-in metrics and alerts

- [ ] **Database Initialization**
  ```sql
  -- Execute in order:
  infra/initdb/001_initial_schema.sql
  infra/initdb/002_admin_users.sql
  infra/initdb/003_races_table.sql
  infra/initdb/004_race_reports_table.sql
  infra/initdb/005_clubs_table.sql
  infra/initdb/006_spatial_indexes.sql
  infra/initdb/007_triggers.sql
  infra/initdb/008_sample_data.sql
  ```

- [ ] **Environment Variables**
  - `DATABASE_URL` - Auto-generated by Render
  - `POSTGRES_HOST` - Database hostname
  - `POSTGRES_PORT` - Database port (5432)
  - `POSTGRES_DB` - Database name
  - `POSTGRES_USER` - Database username
  - `POSTGRES_PASSWORD` - Database password

### Phase 2: Backend API Service (HIGH PRIORITY)

#### 🌐 FastAPI Web Service
- [ ] **Create Render Web Service**
  - **Service Type**: Web Service
  - **Runtime**: Python 3.11
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - **Health Check**: `GET /health` (needs implementation)

- [ ] **API Configuration**
  ```yaml
  Environment Variables:
    DATABASE_URL: ${DATABASE_URL}
    ADMIN_USERNAME: admin
    ADMIN_PASSWORD: @RunHouston9339
    ADMIN_SECRET: 67_SwDEkwSMTE2y2pzb817x-nDHJCG19Mb5pZmD3HQQ
    CORS_ORIGINS: https://runhouston.app,https://www.runhouston.app
    LOG_LEVEL: INFO
    ENVIRONMENT: production
    API_VERSION: v1.0.0
    BUILD_VERSION: ${GIT_COMMIT_SHA}
    DEPLOYMENT_DATE: ${DEPLOYMENT_TIMESTAMP}
  ```

- [ ] **Security Enhancements**
  - [ ] Implement health check endpoint
  - [ ] Add request rate limiting
  - [ ] Configure CORS for production domains only
  - [ ] Add security headers middleware
  - [ ] Implement request logging (structured JSON)

### Phase 3: Frontend Web Application (HIGH PRIORITY)

#### 🌐 React Static Site
- [ ] **Create Render Static Site**
  - **Service Type**: Static Site
  - **Build Command**: `npm ci && npm run build`
  - **Publish Directory**: `dist`
  - **Node Version**: 18.x

- [ ] **Frontend Configuration**
  ```yaml
  Environment Variables:
    VITE_API_BASE: https://api.runhouston.app
    VITE_APP_NAME: Run Houston
    VITE_APP_VERSION: 1.0.0
    VITE_ENVIRONMENT: production
    VITE_BUILD_HASH: ${GIT_COMMIT_SHA}
    VITE_BUILD_DATE: ${BUILD_TIMESTAMP}
    VITE_API_VERSION: v1.0.0
  ```

- [ ] **Build Optimization**
  - [ ] Enable code splitting
  - [ ] Configure asset optimization
  - [ ] Set up CDN caching headers
  - [ ] Implement service worker for offline support

### Phase 4: Mobile Application (MEDIUM PRIORITY)

#### 📱 React Native Production Builds
- [ ] **Android Production Build**
  ```bash
  cd mobile
  expo build:android --type apk
  # or for AAB (Google Play Store)
  expo build:android --type app-bundle
  ```

- [ ] **iOS Production Build**
  ```bash
  cd mobile
  expo build:ios --type archive
  ```

- [ ] **Mobile Configuration Updates**
  - [ ] Update `mobile/src/config.ts` for production API
  - [ ] Configure app store metadata
  - [ ] Set up push notifications (Firebase)
  - [ ] Implement deep linking

---

## 🔒 Security & Compliance

### Security Hardening Checklist
- [ ] **CORS Configuration**
  - [ ] Remove wildcard origins (`*`)
  - [ ] Restrict to production domains only
  - [ ] Configure preflight request handling

- [ ] **API Security**
  - [ ] Implement request rate limiting
  - [ ] Add input validation middleware
  - [ ] Configure security headers (HSTS, CSP, etc.)
  - [ ] Set up API key authentication for admin endpoints

- [ ] **Database Security**
  - [ ] Enable SSL connections
  - [ ] Configure connection pooling
  - [ ] Set up database user permissions
  - [ ] Implement query logging and monitoring

- [ ] **Environment Security**
  - [ ] Rotate JWT secrets
  - [ ] Use strong, unique passwords
  - [ ] Enable database encryption at rest
  - [ ] Configure backup encryption

### Monitoring & Observability
- [ ] **Application Monitoring**
  - [ ] Set up error tracking (Sentry)
  - [ ] Configure performance monitoring
  - [ ] Implement health check endpoints
  - [ ] Set up uptime monitoring
  - [ ] Track version deployment metrics
  - [ ] Monitor API version adoption

- [ ] **Database Monitoring**
  - [ ] Configure query performance monitoring
  - [ ] Set up slow query alerts
  - [ ] Monitor connection pool usage
  - [ ] Track database size and growth
  - [ ] Monitor schema migration status
  - [ ] Track database version compatibility

- [ ] **Version Tracking**
  - [ ] Deploy version dashboard
  - [ ] Track component versions across environments
  - [ ] Monitor version compatibility matrix
  - [ ] Alert on version mismatches

---

## 🌍 Domain & SSL Configuration

### Domain Setup
- [ ] **Primary Domain**: `runhouston.app`
- [ ] **API Subdomain**: `api.runhouston.app`
- [ ] **Admin Subdomain**: `admin.runhouston.app` (optional)

### SSL/TLS Configuration
- [ ] **Automatic HTTPS** (handled by Render)
- [ ] **SSL Certificate**: Let's Encrypt (automatic)
- [ ] **HTTP to HTTPS Redirect**: Enabled
- [ ] **HSTS Headers**: Configured

---

## 📊 Performance & Scalability

### Performance Optimization
- [ ] **Database Optimization**
  - [ ] Configure connection pooling
  - [ ] Set up read replicas (if needed)
  - [ ] Optimize spatial indexes
  - [ ] Implement query caching

- [ ] **API Optimization**
  - [ ] Enable response compression
  - [ ] Implement Redis caching
  - [ ] Add database query optimization
  - [ ] Configure CDN for static assets

- [ ] **Frontend Optimization**
  - [ ] Enable gzip compression
  - [ ] Implement lazy loading
  - [ ] Optimize bundle size
  - [ ] Set up image optimization

### Scalability Planning
- [ ] **Horizontal Scaling**
  - [ ] Configure load balancing
  - [ ] Set up auto-scaling policies
  - [ ] Implement session management
  - [ ] Plan for database sharding

---

## 🧪 Testing & Quality Assurance

### Pre-Deployment Testing
- [ ] **Integration Testing**
  - [ ] End-to-end API testing
  - [ ] Database migration testing
  - [ ] Cross-browser compatibility
  - [ ] Mobile device testing

- [ ] **Performance Testing**
  - [ ] Load testing with realistic data
  - [ ] Stress testing API endpoints
  - [ ] Database performance under load
  - [ ] Frontend performance metrics

- [ ] **Security Testing**
  - [ ] Penetration testing
  - [ ] Vulnerability scanning
  - [ ] Authentication flow testing
  - [ ] Data validation testing

### Post-Deployment Validation
- [ ] **Smoke Tests**
  - [ ] API health check
  - [ ] Database connectivity
  - [ ] Frontend loading
  - [ ] Mobile app connectivity

- [ ] **User Acceptance Testing**
  - [ ] Admin workflow testing
  - [ ] Public user experience
  - [ ] Mobile app functionality
  - [ ] Performance validation

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (125+ tests)
- [ ] Environment variables configured
- [ ] Security hardening completed
- [ ] Performance optimization applied
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Deployment Steps
1. [ ] Create Render PostgreSQL database
2. [ ] Initialize database schema
3. [ ] Deploy FastAPI backend service
4. [ ] Deploy React frontend static site
5. [ ] Configure custom domains
6. [ ] Set up SSL certificates
7. [ ] Update mobile app configuration
8. [ ] Build and distribute mobile apps

### Post-Deployment
- [ ] Run smoke tests
- [ ] Verify all functionality
- [ ] Monitor performance metrics
- [ ] Check error logs
- [ ] Validate security configuration
- [ ] Test backup and recovery

---

## 🚨 Rollback Plan

### Emergency Procedures
- [ ] **Database Rollback**
  - [ ] Restore from latest backup
  - [ ] Revert schema changes
  - [ ] Validate data integrity

- [ ] **Service Rollback**
  - [ ] Revert to previous API version
  - [ ] Rollback frontend deployment
  - [ ] Restore previous configuration

- [ ] **Communication Plan**
  - [ ] Notify users of maintenance
  - [ ] Document incident response
  - [ ] Set up status page

---

## 📈 Success Metrics

### Performance Targets
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **Frontend Load Time**: < 3 seconds
- **Uptime**: 99.9%

### Business Metrics
- **User Registration**: Track admin users
- **Race Data**: Monitor race creation/updates
- **Mobile Downloads**: Track app installations
- **API Usage**: Monitor endpoint utilization

### Version Metrics
- **API Version Adoption**: Track v1.0.0 usage
- **Mobile App Version Distribution**: Monitor app store versions
- **Database Schema Version**: Track migration status
- **Frontend Build Version**: Monitor deployment frequency
- **Version Compatibility**: Track cross-component compatibility

---

## 🔄 Maintenance & Updates

### Regular Maintenance
- [ ] **Weekly**: Review logs and metrics
- [ ] **Monthly**: Security updates and patches
- [ ] **Quarterly**: Performance optimization review
- [ ] **Annually**: Security audit and penetration testing

### Update Procedures
- [ ] **API Updates**: Blue-green deployment
- [ ] **Frontend Updates**: Zero-downtime deployment
- [ ] **Database Updates**: Migration scripts
- [ ] **Mobile Updates**: App store releases

---

## 📞 Support & Documentation

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema documentation
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] User manuals

### Support Channels
- [ ] Error monitoring and alerting
- [ ] Log aggregation and analysis
- [ ] Performance monitoring dashboard
- [ ] Incident response procedures

---

**Last Updated**: 2025-09-05  
**Status**: Ready for Production Deployment  
**Next Action**: Create Render PostgreSQL database  
**Estimated Completion**: 2-3 days for full deployment

