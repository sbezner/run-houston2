# 🐛 Bug Tracking & Issue Log

## 📋 **Current Active Bugs**

### **🔴 Critical Priority**

**Bug #15**
- [x] **Bug Title**: Authentication error handling broken - no redirect to login when token expires
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: High
  - **Status**: Open
  - **Priority**: P1
  - **Description**: When JWT tokens expire or become invalid, the system correctly detects authentication failures but fails to redirect users to the login page. Users get stuck on admin pages with error messages instead of being properly redirected to re-authenticate.
  - **Steps to Reproduce**: 
    1. Login to admin panel
    2. Clear localStorage (DevTools → Application → Local Storage → Clear)
    3. Try to access admin functions (races, clubs, race reports)
    4. Observe error messages but no redirect to login
    5. Notice inconsistent behavior across different admin pages
  - **Expected Behavior**: 
    1. Authentication failures should trigger immediate redirect to login page
    2. Consistent behavior across all admin pages
    3. Clear user feedback about authentication status
    4. Proper session management
  - **Actual Behavior**: 
    1. Error messages displayed but no redirect
    2. Inconsistent behavior between admin pages
    3. Users stuck on admin pages with broken functionality
    4. Poor user experience for authentication failures
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI, JWT
  - **Screenshots/Logs**: Error messages without redirects, inconsistent admin page behavior
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/hooks/useAuth.ts`, `web/src/services/api.ts`, `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/pages/AdminDashboard/AdminRaceReportsPage.tsx`
    - **Key functions/methods**: `handleTokenExpiration`, API error handling, authentication state management
    - **Database tables/columns**: N/A - Frontend authentication flow issue
    - **API endpoints**: N/A - Frontend authentication flow issue
  - **Assigned To**: Developer
  - **Notes**: This is a critical user experience issue that breaks the authentication flow. The JWT migration is working correctly, but the error handling and redirect logic is incomplete. This needs to be fixed before the migration can be considered complete.
  - **Related Issues**: JWT authentication migration (Bug #12), authentication flow testing
  - **User Impact**: High - users cannot properly re-authenticate when sessions expire
  - **Fix Required**: Implement proper authentication error handling with automatic redirects to login page
  - **Status**: Fixed

**Bug #14**
- [ ] **Bug Title**: Race reports CSV import incorrectly uses imported race_name instead of database race name
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: When importing race reports via CSV that reference existing races by race_id, the system incorrectly uses the race_name value from the CSV instead of looking up and using the actual race name from the database. This can lead to data inconsistency where the displayed race name doesn't match the actual race in the database.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Race Reports
    2. Click "Import CSV" button
    3. Import CSV with race_id pointing to existing race and race_name field populated
    4. Observe that the imported race report shows the CSV race_name instead of the database race name
    5. Verify that the race_id correctly links to an existing race in the database
  - **Expected Behavior**: 
    1. When race_id references an existing race, the race_name should be ignored from CSV
    2. System should look up the actual race name from the database using race_id
    3. Displayed race name should always match the database race name
    4. CSV race_name field should be treated as informational only when race_id is valid
  - **Actual Behavior**: 
    1. CSV race_name value is used even when race_id points to existing race
    2. Database race name is not looked up or used
    3. Potential for data inconsistency between displayed and actual race names
    4. CSV race_name overrides database race information
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Race reports showing CSV race_name instead of database race name
   - **Suggested Code Locations**:
     - **Files to investigate**: `api/app/main.py`, `web/src/components/admin/RaceReportsImportDialog.tsx`
     - **Key functions/methods**: `import_race_reports_csv`, CSV import validation and processing
     - **Database tables/columns**: `race_reports` table, `race_id` foreign key relationship
     - **API endpoints**: POST `/admin/race_reports/import`
   - **Assigned To**: Developer
   - **Notes**: This is a minor data consistency issue. The CSV import should prioritize database relationships over imported text values. When race_id is valid, the system should always use the database race name to maintain data integrity.
   - **Related Issues**: Race report data consistency, CSV import validation
   - **User Impact**: Low - affects data accuracy but doesn't break functionality
   - **Fix Required**: Modify CSV import logic to ignore race_name when race_id is valid and lookup database race name instead
   - **Status**: Open

**Bug #21**
- [x] **Bug Title**: Load More reports functionality broken - reports replaced instead of appended
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Fixed
  - **Priority**: P2
  - **Description**: The "Load More" button in the race reports web interface was not working correctly. When clicked, it would replace the existing reports instead of appending new ones, making pagination unusable.
  - **Steps to Reproduce**: 
    1. Go to Race Reports page
    2. If there are more than 20 reports, click "Load More Reports" button
    3. Observe that existing reports disappear and only new reports are shown
    4. Notice that pagination is broken and user loses access to previously loaded reports
  - **Expected Behavior**: 
    1. "Load More" should append new reports to existing ones
    2. All previously loaded reports should remain visible
    3. Pagination should work correctly
    4. User should see cumulative reports as they load more
  - **Actual Behavior**: 
    1. Clicking "Load More" replaced existing reports with new ones
    2. Users lost access to previously loaded reports
    3. Pagination was effectively broken
    4. Poor user experience for browsing multiple pages of reports
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Reports disappearing when Load More clicked
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/ReportsPage.tsx`
    - **Key functions/methods**: `fetchReports`, `handleLoadMore`, state management for reports array
    - **Database tables/columns**: N/A - Frontend pagination issue
    - **API endpoints**: N/A - Frontend pagination issue
  - **Assigned To**: Developer
  - **Notes**: This was a critical pagination bug that made the Load More functionality unusable. The fix ensures that reports are properly appended instead of replaced, maintaining the user's browsing context.
  - **Related Issues**: Race reports pagination, user experience
  - **User Impact**: Medium - pagination was broken but basic functionality remained
  - **Fix Required**: Modify state management to append new reports instead of replacing existing ones
  - **Status**: Fixed
  - **Fix Applied**: Updated `fetchReports` function to conditionally handle report loading - replace for initial load (offset === 0), append for subsequent loads (offset > 0)
  - **Test Coverage**: Created comprehensive logic tests in `ReportsPage.logic.test.ts` to verify the fix

**Bug #20**
- [ ] **Bug Title**: Clubs CSV import missing template download functionality - poor user experience
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P4
  - **Description**: The clubs CSV import functionality lacks a template download feature that other import systems (races, race reports) provide. Users cannot download a sample CSV template to understand the required format, headers, and data structure, making the import process more difficult and error-prone.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Clubs
    2. Click "📥 Import CSV" button
    3. Observe the import dialog
    4. Notice there's no "Download Template" or similar button
    5. Compare with races import which has template download functionality
  - **Expected Behavior**: 
    1. Clubs CSV import should have a "Download Template" button
    2. Template should show correct headers: id, club_name, location, website_url
    3. Template should include sample data rows
    4. Template should match the format expected by the backend validation
    5. Consistent with races and race reports import experience
  - **Actual Behavior**: 
    1. No template download button available
    2. Users must guess the correct CSV format
    3. No sample data provided
    4. Inconsistent with other import systems
    5. Poor user experience for CSV import
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Clubs import dialog showing no template download option
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/components/admin/ClubsImportDialog.tsx` (to be created)
    - **Key functions/methods**: `handleImportCsv`, CSV import UI components, template download functionality
    - **Database tables/columns**: N/A - Frontend UX enhancement
    - **API endpoints**: N/A - Frontend UX enhancement
  - **Assigned To**: Developer
  - **Notes**: This is a UX improvement issue. The clubs CSV import works functionally but lacks the user-friendly template download feature that other import systems provide. This affects user experience and makes CSV import more difficult for users who don't know the expected format.
  - **Related Issues**: UI consistency with races and race reports import functionality, user experience improvements
  - **User Impact**: Low - affects user convenience but doesn't break functionality
  - **Fix Required**: Add template download button and functionality to clubs CSV import, similar to races import
  - **Status**: Open

**Bug #22**
- [x] **Bug Title**: Mobile app race reports limited to 20 items - missing infinite scroll and lazy loading
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Fixed
  - **Priority**: P2
  - **Description**: The mobile app's race reports screen only shows the first 20 race reports with no way to load more. Users cannot access older race reports, creating a poor user experience where they miss potentially important content. The app should implement infinite scroll with lazy loading to show all available race reports.
  - **Steps to Reproduce**: 
    1. Open the Run Houston mobile app
    2. Navigate to Race Reports section
    3. Scroll through the list of reports
    4. Notice only ~20 reports are displayed
    5. Observe there's no "Load More" button or infinite scroll functionality
    6. Verify that older race reports exist in the database but aren't accessible
  - **Expected Behavior**: 
    1. Mobile app should implement infinite scroll for race reports
    2. As user scrolls down, more reports should automatically load
    3. All race reports should be accessible through continuous scrolling
    4. Smooth lazy loading experience with loading indicators
    5. No artificial limit on the number of reports displayed
  - **Actual Behavior**: 
    1. Only first 20 race reports are displayed
    2. No pagination or "Load More" functionality
    3. Users cannot access older race reports
    4. Hardcoded limit of 20 items in the mobile app
    5. Poor user experience for browsing race report history
  - **Environment**: 
    - **OS**: Windows 10
    - **Mobile Platform**: React Native/Expo
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React Native, TypeScript, FastAPI
  - **Screenshots/Logs**: Mobile app showing limited race reports with no pagination
  - **Suggested Code Locations**:
    - **Files to investigate**: `mobile/src/screens/ReportsScreen.tsx`, `mobile/src/api.ts`
    - **Key functions/methods**: `ReportsScreen` component, `fetchRaceReports` API call, FlatList implementation
    - **Database tables/columns**: `race_reports` table, pagination parameters
    - **API endpoints**: Race reports list endpoint with pagination support
  - **Assigned To**: Developer
  - **Notes**: This is a critical mobile UX issue. The mobile app should provide the same access to race reports as the web interface, with infinite scroll being the standard mobile pattern for long lists. The backend API already supports pagination, but the mobile app isn't utilizing it.
  - **Related Issues**: Mobile app user experience, race reports accessibility, infinite scroll implementation
  - **User Impact**: Medium - users cannot access older race reports, missing potentially important content
  - **Fix Required**: Implement infinite scroll with lazy loading in mobile app race reports screen
  - **Status**: Fixed
  - **Fix Applied**: 2025-01-27
  - **Solution**: 
    - Implemented infinite scroll with lazy loading using FlatList's onEndReached
    - Added pagination state management (offset, hasMore, loadingMore)
    - Created unified loadReports function that handles initial load, refresh, and load more
    - Added loading indicator at bottom when fetching more reports
    - Reports now append to existing list instead of replacing
    - Users can scroll continuously to access all race reports
  - **Files Changed**: `mobile/src/screens/ReportsScreen.tsx`
  - **Test Coverage**: Manual testing of infinite scroll functionality

**Bug #19**
- [ ] **Bug Title**: Race CSV import surface validation too strict - case sensitivity creates poor UX
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P4
  - **Description**: The race CSV import surface validation is overly strict about case sensitivity. Users must enter surface values in exact lowercase (e.g., "road", "trail") instead of allowing natural case variations (e.g., "Road", "Trail", "ROAD", "trail"). This creates unnecessary friction and validation errors for users who naturally capitalize words.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Click "Import CSV" button
    3. Import CSV with surface values like "Road", "Trail", "ROAD"
    4. Observe validation errors: "Surface should be one of: road, trail, track, virtual, other"
    5. Notice that only lowercase values are accepted
  - **Expected Behavior**: 
    1. Surface validation should accept any case variation
    2. "Road", "ROAD", "road" should all be valid
    3. "Trail", "TRAIL", "trail" should all be valid
    4. System should normalize case internally
    5. Better user experience with flexible input
  - **Actual Behavior**: 
    1. Only exact lowercase values accepted
    2. "Road" rejected, only "road" accepted
    3. "Trail" rejected, only "trail" accepted
    4. Users get validation errors for natural capitalization
    5. Poor user experience requiring exact case matching
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: CSV validation errors for surface field case sensitivity
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/ImportCsv/parseCsv.ts`, `web/src/pages/AdminDashboard/ImportCsv/validation.ts`
    - **Key functions/methods**: Surface validation logic, CSV parsing and validation
    - **Database tables/columns**: N/A - Frontend validation issue
    - **API endpoints**: N/A - Frontend validation issue
  - **Assigned To**: Developer
  - **Notes**: This is a UX improvement issue. The validation should be more user-friendly by accepting case variations and normalizing them internally. This affects the race CSV import workflow and user experience.
  - **Related Issues**: Race CSV import validation, user experience improvements
  - **User Impact**: Low - affects user convenience but doesn't break functionality
  - **Fix Required**: Update surface validation to accept case variations and normalize values internally
  - **Status**: Open

**Bug #18**
- [ ] **Bug Title**: Error banner persists after server recovery - cosmetic UI cleanup issue
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P4
  - **Description**: When the backend server goes down and admin operations fail with "Failed to fetch" errors, the error banner remains visible even after the server is restored and operations work normally. This creates a confusing user experience where error messages persist despite successful recovery.
  - **Steps to Reproduce**: 
    1. Stop backend server temporarily
    2. Try to perform admin operations (edit, create, delete races)
    3. Observe "Failed to fetch" error banner appears
    4. Restart backend server
    5. Verify admin operations work normally
    6. Notice error banner still displays despite successful recovery
    7. Refresh page to clear the error banner
  - **Expected Behavior**: 
    1. Error banner should automatically clear when operations succeed
    2. System should detect successful recovery and update UI accordingly
    3. No manual page refresh should be required to clear error state
    4. UI should reflect current system status accurately
  - **Actual Behavior**: 
    1. Error banner persists after server recovery
    2. Users see outdated error messages despite working functionality
    3. Manual page refresh required to clear error state
    4. UI doesn't automatically reflect recovery status
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Error banner showing "Failed to fetch" after successful operations
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/services/api.ts`, `web/src/hooks/useRaces.ts`, error handling components
    - **Key functions/methods**: API error handling, error state management, success callback handling
    - **Database tables/columns**: N/A - Frontend UI state management issue
    - **API endpoints**: N/A - Frontend UI state management issue
  - **Assigned To**: Developer
  - **Notes**: This is a minor cosmetic issue that doesn't affect functionality. The system correctly handles server failures and recovery, but the UI doesn't automatically clean up error states. This could be improved by implementing automatic error state clearing on successful operations or adding a recovery detection mechanism.
  - **Related Issues**: Error handling testing (Bug #12), server error recovery
  - **User Impact**: Low - affects user experience clarity but doesn't break functionality
  - **Fix Required**: Implement automatic error banner clearing on successful operations or add recovery detection
  - **Status**: Open

**Bug #13**
- [ ] **Bug Title**: Clubs CSV import lacks rich UI experience - no preview, validation, or progress feedback
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P3
  - **Description**: The clubs CSV import functionality works correctly (authentication, parsing, database operations) but lacks the rich user experience that races and race reports imports provide. Users get no preview of data, no validation feedback, no progress indication, and only a generic success message.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Clubs
    2. Click "📥 Import CSV" button
    3. Select a valid CSV file
    4. Observe the import completes with just a browser alert saying "CSV imported successfully!"
    5. Notice no preview of CSV data, no validation results, no progress feedback
    6. Compare with races/race reports import which show rich UI with preview, validation, and progress
  - **Expected Behavior**: 
    1. CSV import should show preview of data before importing
    2. Validation results should be displayed with row-by-row feedback
    3. Progress indication should show during import process
    4. Success/error messages should be specific about what was imported/updated
    5. UI should match the quality of races and race reports import experience
  - **Actual Behavior**: 
    1. No preview of CSV data before import
    2. No validation feedback or error highlighting
    3. No progress indication during import
    4. Generic success message with no details
    5. Poor user experience compared to other import functions
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Basic browser alert, no rich UI components
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/components/admin/ClubsImportDialog.tsx` (to be created)
     - **Key functions/methods**: `handleImportCsv`, CSV import UI components
     - **Database tables/columns**: `clubs` table import functionality
     - **API endpoints**: POST `/admin/clubs/import-csv`
   - **Assigned To**: Developer
   - **Notes**: This is a UI/UX enhancement issue, not a functional bug. The CSV import works correctly with JWT authentication, data parsing, and database operations. The backend is functioning properly. This bug focuses on improving the user experience to match the quality of other import functions.
   - **Related Issues**: UI consistency with races and race reports import functionality
   - **User Impact**: Medium - users can import data but lack visibility into what's happening during the process
   - **Fix Required**: Create rich UI components similar to races/race reports import with preview, validation, and progress feedback
   - **Status**: Open

**Bug #26**
- [x] **Bug Title**: Distance field case sensitivity and data integrity issues
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Fixed
  - **Priority**: P1
  - **Description**: The distance field lacks proper case normalization and database constraints, leading to data inconsistency and validation errors. This is a systematic data integrity issue affecting the entire race management system.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Try to edit race ID 10
    3. Notice the form sends 'Full' but backend expects 'Marathon'
    4. Observe 422 validation error
    5. Check database - distance field has no constraints
    6. Compare with surface field which has proper constraints
  - **Expected Behavior**: 
    1. Distance field should have database constraints like surface field
    2. Backend should normalize distances to lowercase
    3. Frontend should show user-friendly terms (Full Marathon vs Marathon)
    4. CSV import should normalize case
    5. Surface and Distance fields should follow same validation pattern
  - **Actual Behavior**: 
    1. No database constraint on distance field
    2. Backend validation is case-sensitive (no normalization)
    3. Frontend shows technical terms instead of user-friendly ones
    4. CSV import doesn't normalize case
    5. Different validation behavior between Surface and Distance fields
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: 422 validation errors, inconsistent distance data in database
   - **Suggested Code Locations**:
     - **Files to investigate**: `api/app/models.py`, `web/src/components/RaceForm.tsx`, database schema, CSV import parsers
     - **Key functions/methods**: `validate_distance`, distance validation logic, CSV distance parsing
     - **Database tables/columns**: `races.distance` field constraints
     - **API endpoints**: Race creation/update endpoints
   - **Assigned To**: Developer
   - **Notes**: This is a systematic data integrity issue that needs fixing at multiple levels: database constraints, backend validation, frontend mapping, and CSV import normalization. Surface field follows the correct pattern (lowercase constraints + case normalization) that Distance field should also follow.
   - **Related Issues**: Data consistency, validation errors, CSV import case handling
   - **User Impact**: High - affects race editing, data consistency, and system reliability
   - **Fix Required**: Add database constraint, normalize backend validation, update frontend mapping, fix CSV import case handling
   - **Status**: Fixed
   - **Resolution**: 
     - ✅ Database constraints added (NOT NULL + validation constraint)
     - ✅ All 68 existing races updated to standardized lowercase values
     - ✅ Backend Pydantic models updated with smart distance validation and mapping
     - ✅ Frontend forms updated to show user-friendly terms and send standardized values
     - ✅ CSV import validation updated with case normalization and smart mapping
     - ✅ Mobile frontend updated to use standardized distance values
     - ✅ All unit tests and integration tests passing
     - ✅ Standardized distance values: ['5k', '10k', 'half marathon', 'marathon', 'ultra', 'other']

**Bug #1**
- [x] **Bug Title**: Race report editing form missing ID display and race ID validation issues
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Fixed
  - **Priority**: P1
  - **Description**: Critical issues with race report editing form that affect user experience and data integrity:
    1. Edit race report form should display the race ID and allow it to be edited
    2. Race ID field should allow null values for orphaned reports
    3. Race ID field should be a simple number input (not dropdown) and be optional
    4. Invalid race IDs should show validation errors in UI and prevent saving
    5. CSV import should validate race IDs and show errors for invalid references
    6. CSV export should handle null race IDs appropriately
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Race Reports
    2. Click "Edit" on any race report
    3. Notice the form doesn't show the race report ID anywhere
    4. Notice the race selection is a required dropdown instead of optional number input
    5. Try to enter an invalid race ID in the race ID field
    6. Try to import CSV with invalid race IDs
    7. Observe system crashes or validation errors
  - **Expected Behavior**: 
    1. Edit form should display race ID prominently and allow editing
    2. Race ID field should be an optional number input field (not dropdown)
    3. Race ID field should accept null values gracefully
    4. Race ID field should allow null values and invalid race IDs should show validation errors and prevent form submission
    5. CSV import should validate all race IDs and show row-specific errors
    6. CSV export should handle null race IDs gracefully
  - **Actual Behavior**: 
    1. No ID display in edit form - users can't identify which report they're editing
    2. Race ID field is a required dropdown that doesn't allow null values
    3. System crashes when referenced race doesn't exist
    4. No validation feedback for invalid race IDs
    5. CSV import doesn't validate race ID references
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: 409 Conflict errors, form validation failures
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/components/admin/RaceReportForm.tsx`, `api/app/main.py`, `api/app/models.py`, `web/src/types.ts`, `web/src/components/admin/RaceReportsImportDialog.tsx`
     - **Key functions/methods**: `update_race_report`, race report form rendering, RaceReportUpdate model, CSV import validation
     - **Database tables/columns**: `race_reports` table, `race_id` field validation
     - **API endpoints**: PUT `/race_reports/{id}`, POST `/admin/race_reports/import`
   - **Assigned To**: Developer
   - **Notes**: This is a critical UX and data integrity issue. Users need to see and edit the ID they're editing, and the system must validate race IDs properly in both UI and CSV operations. Race ID should be optional number input, not required dropdown.
   - **Related Issues**: Affects race report editing functionality, CSV import/export validation
   - **User Impact**: Critical - users cannot properly identify or edit race reports, and invalid data can be imported
   - **Fix Applied**: 2025-01-27
   - **Solution**: 
     - Database schema updated to allow nullable race_id and add race_name column
     - Race ID field changed from required dropdown to optional text input
     - Race report ID now displayed prominently in edit form
     - Race name auto-population implemented when valid race_id is entered
     - CSV import/export validation enhanced for race_id references
     - Unique constraint on race titles removed to allow duplicates
     - Comprehensive test suite created (32 tests) with 100% pass rate
   - **Status**: Fixed

**Bug #2**
- [ ] **Bug Title**: Race deletion blocked by foreign key constraints - no cascade handling for race reports
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Open
  - **Priority**: P1
  - **Description**: When deleting a race that has race reports referencing it, the deletion is blocked due to foreign key constraints. The system should either cascade delete the reports or allow the race_id to be set to null.
  - **Steps to Reproduce**: 
    1. Create a race report that references an existing race
    2. Try to delete the referenced race
    3. Observe deletion is blocked due to foreign key constraint violations
    4. Check database logs for constraint errors
  - **Expected Behavior**: 
    1. Race deletion should either cascade delete all related race reports, OR
    2. Allow race_id in race reports to be set to null when race is deleted, OR
    3. Provide clear error message about dependent reports
  - **Actual Behavior**: 
    1. Race deletion is completely blocked by foreign key constraints
    2. No cascade handling implemented
    3. Users cannot delete races with reports, leading to data cleanup issues
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Foreign key constraint violations, deletion blocked errors
   - **Suggested Code Locations**:
     - **Files to investigate**: `api/app/main.py`, `infra/initdb/010_create_race_reports.sql`
     - **Key functions/methods**: `delete_race`, database foreign key constraints
     - **Database tables/columns**: `race_reports` table, `race_id` foreign key constraint
     - **API endpoints**: DELETE `/races/{id}`
   - **Assigned To**: Developer
   - **Notes**: This is a critical data management issue. Users need to be able to delete races, and the system must handle dependent race reports appropriately.
   - **Related Issues**: Affects race deletion, data cleanup, foreign key relationships
   - **User Impact**: Critical - users cannot clean up obsolete races

**Bug #16**
- [ ] **Bug Title**: Test nuclear database reset option for complete data cleanup
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P4
  - **Description**: Need to test the nuclear database reset option to ensure it properly cleans up all data and allows recovery with a fresh database. This is for testing purposes to verify the reset process works correctly after large dataset testing.
  - **Steps to Reproduce**: 
    1. Stop all services: `docker-compose down`
    2. Remove database volume: `docker volume rm run-houston_postgres_data`
    3. Restart services: `docker-compose up -d`
    4. Verify database is completely empty
    5. Verify admin users are recreated with default credentials
    6. Verify all initialization scripts run correctly
    7. Test admin login with fresh database
  - **Expected Behavior**: 
    1. Database completely wiped and recreated
    2. All tables empty and fresh
    3. Admin users recreated with default passwords
    4. All initialization scripts execute successfully
    5. System fully functional with clean database
    6. No data remnants from previous testing
  - **Actual Behavior**: TBD - needs testing
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: Docker, docker-compose
   - **Screenshots/Logs**: TBD
   - **Suggested Code Locations**:
     - **Files to investigate**: `infra/docker-compose.yml`, `infra/initdb/` folder
     - **Key functions/methods**: Database initialization scripts, admin user creation
     - **Database tables/columns**: All tables should be empty after reset
     - **API endpoints**: All endpoints should work with fresh database
   - **Assigned To**: Developer
   - **Notes**: This is a testing task, not a bug fix. The goal is to verify the nuclear reset option works correctly for future testing scenarios. This will help ensure clean testing environments.
   - **Related Issues**: Performance testing cleanup, large dataset testing
   - **User Impact**: Low - testing infrastructure improvement
   - **Fix Required**: Test and verify nuclear reset process
   - **Status**: Open

**Bug #17**
- [x] **Bug Title**: Critical security vulnerability - admin functions accessible without network connectivity
   - **Date Reported**: 2025-01-27
   - **Reporter**: Developer
   - **Severity**: Critical
   - **Status**: Fixed
   - **Priority**: P1
   - **Description**: Admin functions remain accessible even when the user is not connected to the network. This represents a critical security vulnerability where unauthorized access to admin capabilities is possible without proper network authentication or validation. The system should either require network connectivity for admin operations or have proper offline authentication mechanisms.
   - **Steps to Reproduce**: 
     1. Disconnect from network (WiFi off, ethernet unplugged)
     2. Try to access admin functions (races, clubs, race reports)
     3. Observe that admin operations still work
     4. Notice no network connectivity validation
   - **Expected Behavior**: 
     1. Admin functions should require network connectivity
     2. Network validation should be performed before allowing admin access
     3. Proper error message when network is unavailable
     4. Admin operations should fail gracefully without network
   - **Actual Behavior**: 
     1. Admin functions work without network connectivity
     2. No network validation performed
     3. Admin operations succeed in offline mode
     4. Critical security vulnerability exposed
   - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Admin functions working without network connection
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/hooks/useAuth.ts`, `web/src/services/api.ts`, `web/src/pages/AdminDashboard/`, `api/app/auth.py`
     - **Key functions/methods**: Network connectivity validation, offline authentication, admin access control
     - **Database tables/columns**: N/A - Authentication and network validation issue
     - **API endpoints**: All admin endpoints need network validation
   - **Assigned To**: Developer
   - **Notes**: This is a CRITICAL security vulnerability that must be addressed immediately. Admin functions should not be accessible without proper network connectivity and authentication validation. This could allow unauthorized access to sensitive admin capabilities.
   - **Related Issues**: Authentication security, network validation, admin access control
   - **User Impact**: Critical - security vulnerability that could lead to unauthorized admin access
   - **Fix Applied**: 2025-01-27
   - **Solution**: 
     - Created `NetworkValidator` service to check both local and internet connectivity
     - Updated API service to validate network before admin operations
     - Added network validation to login process
     - Implemented network status indicators in admin dashboard
     - Added comprehensive network monitoring and validation
   - **Files Changed**: 
     - `web/src/services/networkValidator.ts` (new file)
     - `web/src/services/api.ts` (updated with network validation)
     - `web/src/hooks/useAuth.ts` (updated with network validation)
     - `web/src/pages/AdminDashboard/AdminDashboard.tsx` (added network status indicators)
     - `web/src/services/__tests__/networkValidator.test.ts` (new test file)
   - **Status**: Fixed

**Bug #10**
- [ ] **Bug Title**: Create new race form throws "Admin token not found" error - critical authentication issue

**Bug #11**
- [ ] **Bug Title**: Race deletion confirmation should warn about associated race reports being deleted
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: When deleting a race that has associated race reports, the deletion confirmation dialog should clearly warn users that the race reports will also be deleted. Currently, the message only shows "Are you sure you want to delete [race name]? This action cannot be undone." but doesn't mention that dependent race reports will be cascade deleted.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Find a race that has associated race reports
    3. Click "Delete" button on that race
    4. Observe the confirmation dialog
    5. Notice the message only mentions race deletion, not race report deletion
  - **Expected Behavior**: 
    1. Delete confirmation should check if race has associated race reports
    2. If race reports exist, add bold warning: "**This will also delete race report: [race report name]**"
    3. Message should clearly indicate cascade deletion behavior
    4. Users should be fully informed about what will be deleted
  - **Actual Behavior**: 
    1. Delete confirmation only shows: "Are you sure you want to delete [race name]? This action cannot be undone."
    2. No mention of associated race reports being deleted
    3. Users are unaware of cascade deletion behavior
    4. Potential for unintended data loss
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Delete confirmation dialog showing incomplete warning message
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/components/admin/DeleteRaceModal.tsx`
     - **Key functions/methods**: Delete confirmation dialog, race deletion workflow, cascade deletion check
     - **Database tables/columns**: `races` table, `race_reports` table, foreign key relationships
     - **API endpoints**: DELETE `/races/{id}`, race reports query endpoint

**Bug #12**
- [ ] **Bug Title**: Authentication system needs migration from shared secret to JWT across entire program
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Open
  - **Priority**: P1
  - **Description**: The current authentication system uses a mix of shared secret (X-Admin-Secret header) and JWT tokens, creating inconsistency and security concerns. The entire program needs to be migrated to use JWT authentication exclusively across all admin areas: admin races, admin clubs, and admin race reports.
  - **Current State**: 
    1. **Backend**: Mixed authentication - some endpoints use `verify_admin_secret()` while others use `get_current_admin()` JWT verification
    2. **Frontend**: Inconsistent - some API calls use admin secret, others expect JWT tokens
    3. **Admin Races**: Uses shared secret authentication (`verify_admin_secret`)
    4. **Admin Clubs**: Uses shared secret authentication (`verify_admin_secret`)
    5. **Admin Race Reports**: Uses shared secret authentication (`verify_admin_secret`)
    6. **Admin Login**: Generates JWT tokens but they're not used consistently
  - **Expected Behavior**: 
    1. All admin endpoints should use JWT authentication via `get_current_admin()` dependency
    2. Frontend should store and send JWT tokens in Authorization header
    3. Shared secret authentication should be completely removed
    4. Consistent authentication flow across all admin operations
    5. Proper token expiration and refresh handling
  - **Actual Behavior**: 
    1. Inconsistent authentication methods across different endpoints
    2. Frontend sometimes sends admin secret, sometimes expects JWT
    3. Some endpoints reject JWT tokens, others reject admin secrets
    4. Authentication errors and confusion for users
    5. Security risk from shared secret exposure
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI, JWT
   - **Screenshots/Logs**: Authentication errors, inconsistent API responses
   - **Suggested Code Locations**:
     - **Backend Files**: 
       - `api/app/main.py` - Update all admin endpoints to use JWT authentication
       - `api/app/auth.py` - Ensure JWT functions are properly implemented
       - Remove `verify_admin_secret()` function and all its usages
     - **Frontend Files**: 
       - `web/src/services/api.ts` - Update all API calls to use JWT tokens
       - `web/src/services/auth.ts` - Ensure proper JWT token management
       - `web/src/hooks/useAuth.ts` - Update authentication flow
       - `web/src/pages/AdminDashboard/AdminRacesPage.tsx` - Remove admin secret usage
       - `web/src/pages/AdminDashboard/AdminClubsPage.tsx` - Remove admin secret usage
       - `web/src/pages/AdminDashboard/AdminRaceReportsPage.tsx` - Remove admin secret usage
     - **Key Functions/Methods**: 
       - Replace `verify_admin_secret()` calls with `get_current_admin()` dependency
       - Update all API calls to include `Authorization: Bearer <token>` header
       - Remove admin secret environment variables and configuration
     - **API Endpoints to Update**: 
       - POST `/races` - Change from shared secret to JWT
       - PUT `/races/{id}` - Change from shared secret to JWT
       - DELETE `/races/{id}` - Change from shared secret to JWT
       - POST `/clubs` - Change from shared secret to JWT
       - PUT `/clubs/{id}` - Change from shared secret to JWT
       - DELETE `/clubs/{id}` - Change from shared secret to JWT
       - POST `/race_reports` - Change from shared secret to JWT
       - PUT `/race_reports/{id}` - Change from shared secret to JWT
       - DELETE `/race_reports/{id}` - Change from shared secret to JWT
       - POST `/admin/races/import` - Change from shared secret to JWT
       - POST `/admin/clubs/import-csv` - Change from shared secret to JWT
       - POST `/admin/race_reports/import` - Change from shared secret to JWT
   - **Assigned To**: Developer
   - **Notes**: This is a critical security and consistency issue. The current mixed authentication system creates confusion and potential security vulnerabilities. All admin operations should use the same JWT-based authentication flow that's already partially implemented in the login system.
   - **Related Issues**: Admin authentication, API security, user experience consistency
   - **User Impact**: High - affects all admin functionality and creates authentication confusion
   - **Assigned To**: Developer
   - **Notes**: This is a UX improvement that affects data integrity awareness. Users need to be fully informed about cascade deletion behavior to make informed decisions about race deletion. The warning should be prominent and clearly indicate what additional data will be lost.
   - **Related Issues**: Race deletion workflow, data integrity warnings, user experience
   - **User Impact**: Medium - affects user awareness of data deletion consequences
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Open
  - **Priority**: P1
  - **Description**: When attempting to create a new race from the "Create New Race" form, the system throws a "Failed to create race: Admin token not found" error. This is a critical authentication issue that completely blocks race creation functionality and affects core application features.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Click "Add Race" or "Create New Race" button
    3. Fill in race details (name, date, address, etc.)
    4. Click "Create Race" or "Save" button
    5. Observe error: "Failed to create race: Admin token not found"
    6. Race creation fails completely
  - **Expected Behavior**: 
    1. Race creation form should work without authentication errors
    2. New races should be created successfully when form is submitted
    3. System should use proper admin authentication (admin secret)
    4. No authentication-related errors should occur
  - **Actual Behavior**: 
    1. Race creation form throws "Admin token not found" error
    2. Race creation is completely blocked
    3. Users cannot create new races through the web interface
    4. Authentication system appears to be looking for JWT tokens instead of admin secret
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Error message: "Failed to create race: Admin token not found"
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/components/admin/CreateRaceModal.tsx`, `web/src/services/api.ts`, `api/app/main.py`
     - **Key functions/methods**: Race creation form submission, API authentication, admin verification
     - **Database tables/columns**: `races` table creation
     - **API endpoints**: POST `/races` endpoint, admin authentication middleware
   - **Assigned To**: Developer
   - **Notes**: This is a critical authentication issue that completely blocks race creation. The system appears to have a mismatch between frontend authentication (admin secret) and backend expectations (JWT tokens). This affects core application functionality and user experience.
   - **Related Issues**: Admin authentication, race creation workflow, API authentication consistency
   - **User Impact**: Critical - users cannot create new races, affecting core application functionality
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Open
  - **Priority**: P1
  - **Description**: When deleting a race that has race reports referencing it, the deletion is blocked due to foreign key constraints. The system should either cascade delete the reports or allow the race_id to be set to null.
  - **Steps to Reproduce**: 
    1. Create a race report that references an existing race
    2. Try to delete the referenced race
    3. Observe deletion is blocked due to foreign key constraint violations
    4. Check database logs for constraint errors
  - **Expected Behavior**: 
    1. Race deletion should either cascade delete all related race reports, OR
    2. Allow race_id in race reports to be set to null when race is deleted, OR
    3. Provide clear error message about dependent reports
  - **Actual Behavior**: 
    1. Race deletion is completely blocked by foreign key constraints
    2. No cascade handling implemented
    3. Users cannot delete races with reports, leading to data cleanup issues
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Foreign key constraint violations, deletion blocked errors
   - **Suggested Code Locations**:
     - **Files to investigate**: `api/app/main.py`, `infra/initdb/010_create_race_reports.sql`
     - **Key functions/methods**: `delete_race`, database foreign key constraints
     - **Database tables/columns**: `race_reports` table, `race_id` foreign key constraint
     - **API endpoints**: DELETE `/races/{id}`
   - **Assigned To**: Developer
   - **Notes**: This is a critical data management issue. Users need to be able to delete races, and the system must handle dependent race reports appropriately.
   - **Related Issues**: Affects race deletion, data cleanup, foreign key relationships
   - **User Impact**: Critical - users cannot clean up obsolete races

### **🔴 High Priority**

**Bug #3**
- [ ] **Bug Title**: Edit operations don't return to current row position - poor user experience
  - **Date Reported**: 2025-01-27
  - **Reporter**: User
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: When editing a race, club, or race report, after saving the changes, the user is not returned to the row they were editing. This creates poor user experience as users lose their place in long lists and have to scroll/search to find the item they just edited.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races (or Clubs, or Race Reports)
    2. Scroll down to find a specific item to edit
    3. Click "Edit" button on that item
    4. Make changes and save
    5. Observe that the page refreshes but doesn't return to the edited row
    6. User must scroll/search to find the item again
  - **Expected Behavior**: After editing and saving, the page should either:
    - Return to the same scroll position where the edit occurred, OR
    - Highlight/focus the edited row, OR
    - Provide visual feedback showing where the edit occurred
  - **Actual Behavior**: Page refreshes and returns to top of list, losing user's position
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: User experience issue - no error logs
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/pages/AdminDashboard/AdminRaceReportsPage.tsx`
    - **Key functions/methods**: `handleUpdateRace`, `handleUpdateClub`, `handleUpdateRaceReport`, `fetchAdminRaces`, `fetchClubs`, `fetchRaceReports`
    - **Database tables/columns**: N/A (frontend UX issue)
    - **API endpoints**: N/A (frontend UX issue)
  - **Assigned To**: Developer
  - **Notes**: This is a UX improvement that affects all admin edit operations. The current behavior of refreshing and returning to top makes it difficult to edit multiple items in sequence, especially in long lists. Consider implementing scroll position preservation or row highlighting after edit operations.
  - **Related Issues**: Affects all admin edit operations (races, clubs, race reports)
  - **User Impact**: High - users lose their place when editing items in long lists

**Bug #4**
- [ ] **Bug Title**: Distance column formatting issue - missing spaces between multiple distances
  - **Date Reported**: 2025-01-27
  - **Reporter**: User
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: The distance column in the races table displays multiple distances without proper spacing. For example, "5KHalf Marathon" instead of "5K, Half Marathon" or "5K Half Marathon". This makes the data hard to read and affects user experience.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Look at the Distance column in the races table
    3. Find a race with multiple distances (e.g., ID 701)
    4. Observe that distances are concatenated without spaces: "5KHalf Marathon"
  - **Expected Behavior**: Multiple distances should be displayed with proper separation, such as "5K, Half Marathon" or "5K Half Marathon" for readability
  - **Actual Behavior**: Distances are concatenated without spaces: "5KHalf Marathon"
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Races table showing "5KHalf Marathon" in distance column
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`
    - **Key functions/methods**: Distance column rendering in races table
    - **Database tables/columns**: `races` table, `distance` column (array type)
    - **API endpoints**: N/A (frontend display issue)
  - **Assigned To**: Developer
  - **Notes**: This is a display formatting issue. The distance data is stored as an array in the database and needs proper formatting when displayed. The current code likely joins the array without proper separators.
  - **Related Issues**: Distance data is correctly stored and retrieved, only the display formatting needs fixing

**Bug #23**
- [ ] **Bug Title**: Investigate race table checkboxes - determine if bulk selection functionality is needed
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: The races table has individual row checkboxes next to delete buttons, but their purpose and necessity needs investigation. The current implementation may be unnecessary complexity if bulk operations aren't actually needed by users.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Observe individual row checkboxes next to delete buttons
    3. Notice "Select All" button functionality
    4. Question whether this bulk selection feature is actually used
  - **Expected Behavior**: Either:
    - Remove unnecessary checkboxes if bulk operations aren't needed, OR
    - Complete the bulk selection functionality if it serves a real purpose
  - **Actual Behavior**: Checkboxes exist but their purpose is unclear. Users can select multiple races but there's no clear bulk operation workflow.
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Races table showing individual checkboxes
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/pages/AdminDashboard/BulkBar.tsx`
     - **Key functions/methods**: `selectAllRaces()`, `clearSelection()`, checkbox rendering
     - **Database tables/columns**: N/A (frontend UX investigation)
     - **API endpoints**: N/A (frontend UX investigation)
   - **Assigned To**: Developer
   - **Notes**: This is an investigative task to determine if the checkboxes serve a real purpose. If bulk operations aren't needed, removing them would simplify the UI. If they are needed, the functionality should be completed properly.
   - **Related Issues**: UI simplification, feature necessity investigation
   - **User Impact**: Low - affects UI cleanliness and potential feature bloat

**Bug #24**
- [ ] **Bug Title**: Clubs CSV import needs consistent behavior with races and race reports
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The clubs CSV import functionality does not behave consistently with the races and race reports CSV import. It lacks the same multi-step workflow, preview functionality, progress tracking, and detailed error handling that the other import systems have.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Clubs
    2. Click "Import CSV" button
    3. Observe the clubs import dialog
    4. Compare with races import dialog (Admin Dashboard → Races → Import CSV)
    5. Notice differences in functionality and user experience
  - **Expected Behavior**: Clubs CSV import should have the same features as races and race reports imports:
    - Multi-step workflow (parse → preview → commit)
    - File size and row count validation
    - Download template button
    - Preview of first 10 rows before import
    - Progress tracking during import
    - Detailed error reporting with row-specific messages
    - Consistent UI/UX patterns
  - **Actual Behavior**: Clubs CSV import has simpler, less feature-rich interface compared to races and race reports imports
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Comparison between clubs import and races/race reports import dialogs
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/components/admin/ClubsImportDialog.tsx`
    - **Key functions/methods**: Clubs import dialog component, CSV parsing logic
    - **Database tables/columns**: `clubs` table import functionality
    - **API endpoints**: Clubs CSV import endpoint
  - **Assigned To**: Developer
  - **Notes**: This is a consistency issue that affects user experience. Users expect similar functionality across all import operations. The clubs import should be updated to match the more advanced import systems used for races and race reports.
  - **Related Issues**: Races and race reports imports have consistent, advanced functionality

**Bug #25**
- [ ] **Bug Title**: Races import and race reports import have slight behavioral differences
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: While both races and race reports CSV imports have similar multi-step workflows, there are slight behavioral differences that could confuse users. These differences affect the user experience and should be standardized for consistency.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races → Import CSV
    2. Observe the races import workflow and features
    3. Go to Admin Dashboard → Race Reports → Import CSV
    4. Compare the race reports import workflow and features
    5. Notice subtle differences in behavior, validation, or error handling
  - **Expected Behavior**: Both races and race reports CSV imports should have identical workflows, validation rules, error handling, and user experience patterns
  - **Actual Behavior**: There are slight differences between the two import systems that could create user confusion
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Side-by-side comparison of both import dialogs
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/ImportRacesModal.tsx`, `web/src/components/admin/RaceReportsImportDialog.tsx`
    - **Key functions/methods**: Import dialog components, CSV parsing logic, validation rules
    - **Database tables/columns**: `races` and `race_reports` table import functionality
    - **API endpoints**: Races and race reports CSV import endpoints
  - **Assigned To**: Developer
  - **Notes**: This is a consistency issue that affects user experience. Users expect identical behavior across similar functionality. The differences should be identified and standardized to ensure consistent user experience.
  - **Related Issues**: Both imports work correctly but have slight behavioral differences

**Bug #27**
- [ ] **Bug Title**: Home page needs update to reflect current functionality and Android version needs "Coming Soon" banner
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The home page is outdated and doesn't reflect the current functionality of the application. Additionally, the Android version button should have a "Coming Soon" banner since the mobile app is not yet fully implemented.
  - **Steps to Reproduce**: 
    1. Visit the home page of the application
    2. Observe that the content doesn't reflect current features like Race Reports
    3. Look for Android version button/link
    4. Notice there's no indication that it's not yet available
  - **Expected Behavior**: Home page should accurately reflect current application features including:
    - Race Reports functionality
    - Updated feature descriptions
    - Current capabilities and limitations
    - Android version button should clearly show "Coming Soon" or similar status
  - **Actual Behavior**: Home page appears outdated and doesn't match current application state. Android version appears available without indicating it's not yet ready.
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Home page showing outdated content, Android version button without status indication
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/HomePage.tsx`, `web/src/components/HomePage/`, `web/src/App.tsx`
    - **Key functions/methods**: Home page component, navigation components, feature descriptions
    - **Database tables/columns**: N/A (frontend content issue)
    - **API endpoints**: N/A (frontend content issue)
  - **Assigned To**: Developer
  - **Notes**: This is a content and UX issue. The home page should accurately represent what users can expect from the application. The Android version should clearly indicate its development status to set proper user expectations.
  - **Related Issues**: Affects user onboarding and expectations, mobile app development status

**Bug #28**
- [ ] **Bug Title**: About Run Houston mobile version needs update to reflect current functionality
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The About Run Houston screen in the mobile app is outdated and doesn't reflect the current functionality and features available in the application. Users need accurate information about what the app can do.
  - **Steps to Reproduce**: 
    1. Open the Run Houston mobile app
    2. Navigate to the About screen/section
    3. Observe the current content and feature descriptions
    4. Compare with actual app functionality
    5. Notice discrepancies between described and actual features
  - **Expected Behavior**: About screen should accurately describe current app features including:
    - Race Reports functionality and capabilities
    - Current data access and search features
    - App limitations and known issues
    - Accurate version information and development status
    - Clear description of what users can expect
  - **Actual Behavior**: About screen contains outdated information that doesn't match current app capabilities, leading to user confusion about available features
  - **Environment**: 
    - **OS**: Windows 10
    - **Mobile Platform**: React Native/Expo
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React Native, TypeScript, FastAPI
  - **Screenshots/Logs**: About screen showing outdated content and feature descriptions
  - **Suggested Code Locations**:
    - **Files to investigate**: `mobile/src/screens/AboutScreen.tsx`, `mobile/src/components/About/`, `mobile/App.tsx`
    - **Key functions/methods**: About screen component, content rendering, feature descriptions
    - **Database tables/columns**: N/A (frontend content issue)
    - **API endpoints**: N/A (frontend content issue)
  - **Assigned To**: Developer
  - **Notes**: This is a content and UX issue that affects user understanding of app capabilities. The About screen should provide accurate, up-to-date information to set proper user expectations and reduce confusion.
  - **Related Issues**: Affects user onboarding, feature discovery, and app credibility

**Bug #30**
- [ ] **Bug Title**: MD file organization and cleanup needed - obsolete files and poor structure

**Bug #9**
- [ ] **Bug Title**: Website URL field for manage clubs should allow null values instead of being required
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The website URL field in the manage clubs screen is currently marked as required, but it should allow null values. Not all clubs have websites, and forcing users to provide a URL creates unnecessary friction and data entry issues.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Clubs
    2. Click "Add Club" or "Edit Club" on an existing club
    3. Notice that the website URL field is marked as required
    4. Try to save without entering a website URL
    5. Observe validation error requiring website URL
  - **Expected Behavior**: 
    1. Website URL field should be optional (not required)
    2. Users should be able to save clubs without providing a website URL
    3. Field should accept null/empty values gracefully
  - **Actual Behavior**: 
    1. Website URL field is marked as required
    2. Users cannot save clubs without providing a website URL
    3. Validation errors occur when field is empty
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Form validation errors when website URL is empty
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/components/admin/ClubForm.tsx`, `api/app/models.py`, `api/app/main.py`
     - **Key functions/methods**: Club form validation, ClubCreate/ClubUpdate models, club creation/update endpoints
     - **Database tables/columns**: `clubs` table, `official_website_url` column
     - **API endpoints**: POST `/admin/clubs`, PUT `/admin/clubs/{id}`
   - **Assigned To**: Developer
   - **Notes**: This is a data model and validation issue. The website URL should be optional since not all clubs have websites. This affects both frontend validation and backend API validation.
   - **Related Issues**: Club management, form validation, data model consistency
   - **User Impact**: Medium - affects club creation and editing workflow
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The project has accumulated multiple MD files that need organization and cleanup. There are obsolete files, poor structure, and a need for better organization of documentation.
  - **Steps to Reproduce**: 
    1. Look at the project root directory
    2. Notice multiple MD files scattered around
    3. Identify obsolete files like TEST_PRIORITY.md (already deleted)
    4. Observe poor organization and structure
  - **Expected Behavior**: 
    1. All MD files should be organized in a dedicated `/docs` or `/markdown` folder
    2. Obsolete files should be removed
    3. Clear structure for different types of documentation
    4. Consistent naming conventions
  - **Actual Behavior**: 
    1. MD files scattered throughout project
    2. Some obsolete files still exist
    3. No clear organization structure
    4. Inconsistent file naming
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Project directory structure showing scattered MD files
   - **Suggested Code Locations**:
     - **Files to investigate**: Project root directory, all `.md` files
     - **Key functions/methods**: File organization and structure
     - **Database tables/columns**: N/A (documentation organization issue)
     - **API endpoints**: N/A (documentation organization issue)
   - **Assigned To**: Developer
   - **Notes**: This is a documentation organization issue that affects project maintainability. Need to create a proper docs structure and move relevant files there while removing obsolete ones.
   - **Related Issues**: Project organization, documentation maintenance
   - **User Impact**: Medium - affects developer experience and project organization
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The mobile app's "All" filter for races is not functioning correctly. When users select "All", they should see all races regardless of date (past, present, and future), but currently the filter may be limited or not working as expected.
  - **Steps to Reproduce**: 
    1. Open the Run Houston mobile app
    2. Navigate to the Races section
    3. Look for filter options (likely "All", "Upcoming", "Past", etc.)
    4. Select "All" filter
    5. Observe the races displayed
    6. Notice that not all races are shown or the filter behavior is unexpected
  - **Expected Behavior**: "All" filter should display:
    - All races in the database regardless of date
    - Past races (completed events)
    - Present races (ongoing events)
    - Future races (upcoming events)
    - No date-based restrictions when "All" is selected
  - **Actual Behavior**: "All" filter either doesn't show all races or has unexpected filtering behavior that limits the results
  - **Environment**: 
    - **OS**: Windows 10
    - **Mobile Platform**: React Native/Expo
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React Native, TypeScript, FastAPI
  - **Screenshots/Logs**: Mobile app showing limited results when "All" filter is selected
  - **Suggested Code Locations**:
    - **Files to investigate**: `mobile/src/screens/RacesScreen.tsx`, `mobile/src/components/RaceFilter.tsx`, `mobile/src/hooks/useRaces.ts`
    - **Key functions/methods**: Filter logic, race fetching, date filtering, API calls
    - **Database tables/columns**: `races` table, `date` column, filter queries
    - **API endpoints**: Races list endpoint, filter parameters
  - **Assigned To**: Developer
  - **Notes**: This is a functionality issue that affects user experience. Users expect "All" to mean truly all races without date restrictions. The filter logic may need to be updated to remove date-based limitations when "All" is selected.
  - **Related Issues**: Affects race discovery, user navigation, filter consistency

- [x] **Bug Title**: Source column not updating when creating/saving races
  - **Date Reported**: 2025-01-27
  - **Reporter**: User
  - **Severity**: High
  - **Status**: Fixed
  - **Description**: When creating a new race or saving an existing race, the source column in the database is not being updated with the current source information
  - **Steps to Reproduce**: 
    1. Create a new race through the web interface
    2. Fill in race details and save
    3. Check database - source column remains empty or unchanged
    4. Edit existing race and save changes
    5. Source column still not updated
  - **Expected Behavior**: Source column should be populated with current source (e.g., "web_interface", "api", "csv_import")
  - **Actual Behavior**: Source column remains empty or shows old value
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: FastAPI, Pydantic V2
  - **Screenshots/Logs**: Database query showing empty source column
  - **Suggested Code Locations**:
    - **Files to investigate**: `api/app/models.py`, `api/app/main.py`, `web/src/services/api.ts`
    - **Key functions/methods**: Race creation/update endpoints, database save operations
    - **Database tables/columns**: `races` table, `source` column
    - **API endpoints**: POST/PUT `/races` endpoints
  - **Assigned To**: Developer
  - **Notes**: This affects data tracking and audit trail functionality
  - **Fix Applied**: 2025-01-27
  - **Solution**: Added source field to RaceUpdate model, fixed source handling in PUT endpoint, removed hardcoded source in POST response, updated frontend defaults
  - **Files Changed**: `api/app/models.py`, `api/app/main.py`, `web/src/components/RaceForm.tsx`, `web/src/pages/AdminDashboard/ImportCsv/ImportPanel.tsx`

- [x] **Bug Title**: CSV import behavior with missing race ID needs investigation
  - **Date Reported**: 2025-01-27
  - **Reporter**: User
  - **Severity**: Medium
  - **Status**: Resolved - Not a Bug
  - **Description**: Need to investigate whether importing a CSV with no race ID field creates a new race or causes an error. This affects data integrity and import behavior.
  - **Steps to Reproduce**: 
    1. Create CSV file with race data but no ID column
    2. Attempt to import via CSV import functionality
    3. Observe whether new races are created or errors occur
    4. Check database to see if races were added with auto-generated IDs
  - **Expected Behavior**: Should either create new races with auto-generated IDs OR provide clear error message about missing ID field
  - **Actual Behavior**: ✅ Creates new races with auto-generated IDs - working as intended
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: FastAPI, Pydantic V2, CSV import functionality
   - **Screenshots/Logs**: CSV file structure and import results
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/pages/AdminDashboard/ImportCsv/`, `api/app/main.py`, `import_races.py`
     - **Key functions/methods**: CSV parsing logic, race creation during import
     - **Database tables/columns**: `races` table, ID generation
     - **API endpoints**: CSV import endpoints, race creation endpoints
   - **Assigned To**: Developer
   - **Notes**: ✅ **RESOLVED**: This is NOT a bug. The system gracefully handles CSV imports without ID field by creating new races with auto-generated IDs. This is intentional, correct behavior that supports both new race creation and existing race updates. Added unit test to verify this behavior.
   - **Investigation Results**: 
     - **Frontend**: ID field is optional in CSV parsing
     - **API**: Smart UPSERT logic - creates new races when no ID, updates existing when ID provided
     - **Database**: Auto-generates IDs for new races
     - **Result**: Perfect data integrity with no errors

**Bug #31**
- [x] **Bug Title**: Race name field should not have clear button - unnecessary UI element
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: The race name field currently has a clear button that is unnecessary and potentially confusing for users. Race names should not be clearable as they are a required field and clearing them would break form validation.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Click "Add Race" or "Edit Race" on any race
    3. Observe the race name field has a clear button (X)
    4. Notice this button is unnecessary since race name is required
  - **Expected Behavior**: 
    1. Race name field should not have a clear button
    2. Field should remain clean and simple
    3. No unnecessary UI elements that could confuse users
  - **Actual Behavior**: 
    1. Race name field displays a clear button (X)
    2. Button is unnecessary since race name is required
    3. Could potentially confuse users about field requirements
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: Race name field showing unnecessary clear button
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/components/RaceForm.tsx`, `web/src/components/admin/CreateRaceModal.tsx`
     - **Key functions/methods**: Race name field rendering, form field components
     - **Database tables/columns**: N/A (frontend UI issue)
     - **API endpoints**: N/A (frontend UI issue)
   - **Assigned To**: Developer
   - **Notes**: This is a minor UI cleanup issue. The clear button serves no purpose on a required field and should be removed for cleaner interface design.
   - **Related Issues**: UI consistency, form field design
   - **User Impact**: Low - affects visual cleanliness and potential user confusion
   - **Fix Applied**: 2025-01-27
   - **Solution**: Added CSS styles to hide browser default clear buttons, added autoComplete="off" and spellCheck="false" attributes to prevent browser interference
   - **Files Changed**: `web/src/components/RaceForm.tsx`, `tests/013_bug_1_comprehensive_test.py`
   - **Status**: Fixed

---

## 📝 **Bug Report Template**

### **Bug Title**: [Brief, descriptive title]

**Date Reported**: YYYY-MM-DD  
**Reporter**: [Your Name]  
**Severity**: [High/Medium/Low]  
**Status**: [Open/In Progress/Fixed/Closed]  
**Priority**: [P1/P2/P3]  

#### **Description**
[Detailed description of what the bug is and how it affects the system]

#### **Steps to Reproduce**
1. [First step]
2. [Second step]
3. [Third step]
4. [Continue as needed]

#### **Expected Behavior**
[What should happen when following the steps above]

#### **Actual Behavior**
[What actually happens instead]

#### **Environment**
- **OS**: [Windows/Mac/Linux version]
- **Browser**: [Chrome/Firefox/Safari version] (if applicable)
- **Python Version**: [3.11.9, etc.]
- **Database**: [PostgreSQL version]
- **Other Dependencies**: [List relevant versions]

#### **Screenshots/Logs**
[Attach any relevant screenshots, error logs, or files]

#### **Additional Context**
[Any other information that might be helpful]

#### **Suggested Code Locations**
**Files to investigate**: [List specific files that likely need changes]
**Key functions/methods**: [List specific functions that might be involved]
**Database tables/columns**: [List relevant database entities]
**API endpoints**: [List relevant API routes if applicable]

#### **Assigned To**
[Developer name or "Unassigned"]

#### **Notes**
[Additional comments, workarounds, or related issues]

---

## 🔄 **Bug Status Definitions**

- **🔴 Open**: Bug reported, not yet investigated
- **🟡 In Progress**: Bug is being worked on
- **🟢 Fixed**: Bug has been resolved, needs testing
- **✅ Closed**: Bug fix verified and deployed
- **❌ Won't Fix**: Bug determined to be non-issue or out of scope

---

## 📊 **Bug Statistics**

| Status | Count | Percentage |
|--------|-------|------------|
| 🔴 Open | 10 | 83.3% |
| 🟡 In Progress | 0 | 0% |
| 🟢 Fixed | 2 | 16.7% |
| ✅ Closed | 0 | 0% |
| ❌ Won't Fix | 0 | 0% |
| **Total** | **12** | **100%** |

---

## 🎯 **Recent Fixes**

### **Fixed**: Source column not updating when creating/saving races - 2025-01-27
- **Issue**: Source column remained empty during race creation/editing
- **Solution**: Added source field to RaceUpdate model, fixed API endpoints, updated frontend defaults
- **Files Changed**: `api/app/models.py`, `api/app/main.py`, `web/src/components/RaceForm.tsx`, `web/src/pages/AdminDashboard/ImportCsv/ImportPanel.tsx`
- **Testing**: Verified source column now properly updates

### **Resolved**: CSV import behavior with missing race ID - 2025-01-27
- **Issue**: Investigation needed to determine if missing ID field causes errors
- **Solution**: Confirmed this is NOT a bug - system gracefully creates new races with auto-generated IDs
- **Files Changed**: `tests/test_frontend_validation.py` (added unit test)
- **Testing**: Added comprehensive unit test verifying correct behavior

---

## 📝 **Notes Section**

### **Development Session**: [Date/Time]
- **Work Done**: Summary of changes made
- **Issues Encountered**: Any problems that came up
- **Next Steps**: What to work on next
- **Questions**: Any questions for the user

---

## 🚀 **Quick Actions**

- **Add New Bug**: Use the template above
- **Update Status**: Change status as bugs progress
- **Mark Fixed**: Move resolved bugs to "Fixed" status
- **Archive**: Move old bugs to "Closed" when verified
- **Priority Update**: Adjust priority based on user feedback

---

*Last Updated: 2025-01-27*
*Total Bugs Tracked: 12*
*Bugs Fixed: 2*
