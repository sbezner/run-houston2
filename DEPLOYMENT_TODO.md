# Deployment TODO List

## Security & Configuration Changes for Production

### 🔐 Database Security
- [ ] **Change development password** in `infra/docker-compose.yml`
  - Current: `POSTGRES_PASSWORD: rh_pass`
  - Action: Use environment variables or secure password
  - File: `infra/docker-compose.yml:8`

### 🌐 API Configuration
- [ ] **Update mobile app API endpoint** in `mobile/src/config.ts`
  - Current: `http://192.168.7.228:8000` (local development)
  - Action: Change to production domain (e.g., `https://api.runhouston.app`)
  - File: `mobile/src/config.ts:3`

### 🔒 CORS Settings
- [ ] **Restrict CORS origins** in `api/app/main.py`
  - Current: `allow_origins=["*"]` (allows all origins)
  - Action: Restrict to only your app's domain(s)
  - File: `api/app/main.py:15`

### 🚀 Hosting Configuration
- [ ] **Set up production database** (PostgreSQL + PostGIS)
  - Current: Local Docker container
  - Action: Use production database service (e.g., Render, AWS RDS)

- [ ] **Configure production environment variables**
  - Create `.env.production` file
  - Set `DATABASE_URL` to production database
  - Set `CORS_ORIGINS` to production domains

### 📱 Mobile App Production
- [ ] **Build production APK/IPA** using Expo
  - Current: Development build
  - Action: `expo build:android` and `expo build:ios`

### 🌍 Domain & SSL
- [ ] **Configure custom domains** in Render
  - API: `api.runhouston.app`
  - Frontend: `runhouston.app` (future)

- [ ] **Ensure HTTPS** everywhere
  - Current: HTTP for local development
  - Required: HTTPS for `.app` domains

## Development vs Production Checklist

| Item | Development | Production |
|------|-------------|------------|
| Database | Local Docker | Production PostgreSQL |
| API URL | Local IP | `https://api.runhouston.app` |
| CORS | All origins (`*`) | Restricted origins |
| Password | `rh_pass` | Environment variable |
| SSL | HTTP | HTTPS required |

## Priority Order
1. **High**: Database password & CORS restrictions
2. **Medium**: API endpoint configuration
3. **Low**: Domain setup & SSL (handled by hosting provider)

---
*Last updated: 2025-08-15*
*Status: Development - Ready for production deployment planning*
