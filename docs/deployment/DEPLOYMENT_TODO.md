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

## 🧪 Unit Testing TODO - Race Reports Feature

### Backend API Testing
- [ ] **Test race_reports table creation and constraints**
  - [ ] Test unique constraint on (race_id, lower(title))
  - [ ] Test foreign key constraint on race_id
  - [ ] Test check constraints on title length (3-120 chars)
  - [ ] Test check constraints on author_name length (2-80 chars if provided)
  - [ ] Test check constraints on content_md length (1-20000 chars)
  - [ ] Test NOT NULL constraints on required fields

- [ ] **Test race_date server management**
  - [ ] Test race_date is automatically set from referenced race.date on CREATE
  - [ ] Test race_date is updated when race_id changes on UPDATE
  - [ ] Test validation that referenced race must have non-null date
  - [ ] Test error handling when race_id references race without date

- [ ] **Test CRUD API endpoints**
  - [ ] Test POST /race_reports (create)
  - [ ] Test GET /race_reports (list with pagination)
  - [ ] Test GET /race_reports/{id} (get by id)
  - [ ] Test PUT /race_reports/{id} (update)
  - [ ] Test DELETE /race_reports/{id} (delete)
  - [ ] Test 404 handling for non-existent reports

- [ ] **Test admin authentication**
  - [ ] Test X-Admin-Secret header validation
  - [ ] Test unauthorized access rejection
  - [ ] Test proper error responses for missing/invalid admin secret

- [ ] **Test search and filtering**
  - [ ] Test q parameter (title search)
  - [ ] Test race_id parameter filtering
  - [ ] Test date_from/date_to range filtering
  - [ ] Test order_by parameter (created_at vs race_date)
  - [ ] Test limit/offset pagination
  - [ ] Test include_race parameter

- [ ] **Test CSV import/export**
  - [ ] Test CSV export format and data integrity
  - [ ] Test CSV import with valid data
  - [ ] Test CSV import validation (dry_run mode)
  - [ ] Test error handling for malformed CSV
  - [ ] Test race resolution by name+date when race_id not provided

- [ ] **Test database triggers and functions**
  - [ ] Test updated_at trigger on row updates
  - [ ] Test updated_at function behavior
  - [ ] Test cascade delete when referenced race is deleted

### Web Frontend Testing
- [ ] **Test ReportsPage component**
  - [ ] Test initial loading state
  - [ ] Test error handling and display
  - [ ] Test search functionality
  - [ ] Test filtering (order_by, date range)
  - [ ] Test pagination controls
  - [ ] Test grouping by race toggle
  - [ ] Test empty state display

- [ ] **Test ReportDetail component**
  - [ ] Test loading state
  - [ ] Test error handling
  - [ ] Test markdown rendering
  - [ ] Test photo gallery display
  - [ ] Test navigation back to list

- [ ] **Test AdminRaceReportsPage component**
  - [ ] Test admin authentication
  - [ ] Test CRUD operations (create, edit, delete)
  - [ ] Test search and filtering
  - [ ] Test CSV import/export
  - [ ] Test pagination
  - [ ] Test error handling

- [ ] **Test RaceReportForm component**
  - [ ] Test form validation
  - [ ] Test markdown preview toggle
  - [ ] Test photo URL validation
  - [ ] Test race_id input validation
  - [ ] Test form submission handling

- [ ] **Test RaceReportsImportDialog component**
  - [ ] Test file upload validation
  - [ ] Test dry run functionality
  - [ ] Test CSV template download
  - [ ] Test import success/error handling

- [ ] **Test API integration**
  - [ ] Test raceReports.list() function
  - [ ] Test raceReports.getById() function
  - [ ] Test raceReports.create() function
  - [ ] Test raceReports.update() function
  - [ ] Test raceReports.remove() function
  - [ ] Test raceReports.exportCsv() function
  - [ ] Test raceReports.importCsv() function

### Mobile App Testing
- [ ] **Test ReportsScreen component**
  - [ ] Test initial loading state
  - [ ] Test error handling and retry
  - [ ] Test search functionality
  - [ ] Test filtering (order_by)
  - [ ] Test pull-to-refresh
  - [ ] Test infinite scroll pagination
  - [ ] Test empty state display

- [ ] **Test API integration**
  - [ ] Test fetchRaceReports() function
  - [ ] Test fetchRaceReportById() function
  - [ ] Test error handling for network failures
  - [ ] Test offline state handling

- [ ] **Test navigation and routing**
  - [ ] Test Reports tab in bottom navigation
  - [ ] Test header title updates
  - [ ] Test report detail navigation (currently shows alert)

### Integration Testing
- [ ] **Test end-to-end workflows**
  - [ ] Test admin creates report → public can view it
  - [ ] Test CSV import → public listing shows imported reports
  - [ ] Test race deletion → associated reports are cascade deleted
  - [ ] Test race date update → report race_date is updated

- [ ] **Test cross-platform consistency**
  - [ ] Test web and mobile show same data
  - [ ] Test search results are consistent across platforms
  - [ ] Test filtering behavior is consistent

### Performance Testing
- [ ] **Test database performance**
  - [ ] Test query performance with large datasets
  - [ ] Test index effectiveness
  - [ ] Test pagination performance

- [ ] **Test frontend performance**
  - [ ] Test large report lists rendering
  - [ ] Test search performance
  - [ ] Test infinite scroll performance

### Test Files to Create
- [ ] `tests/009_race_reports_api_test.py` - Backend API testing
- [ ] `tests/010_race_reports_web_test.py` - Web frontend testing
- [ ] `tests/011_race_reports_mobile_test.py` - Mobile app testing
- [ ] `tests/012_race_reports_integration_test.py` - End-to-end testing

### Test Data Requirements
- [ ] Create test races with various dates
- [ ] Create test race reports with various content
- [ ] Create test CSV files for import testing
- [ ] Create test scenarios for edge cases

---
*Last updated: 2025-08-25*
*Status: Development - Race Reports feature complete, unit testing pending*
