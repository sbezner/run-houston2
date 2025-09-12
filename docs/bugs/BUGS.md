# 🐛 Bug Tracking & Issue Log

## 📋 **Current Active Bugs**

> **Note**: Fixed bugs have been moved to `archive/BUGS.md` for historical reference.

### **🔴 Critical Priority**

**Bug #13**
- [ ] **Bug Title**: Clubs CSV import lacks rich UI experience - no preview, validation, or progress feedback
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P4
  - **Description**: The clubs CSV import functionality works correctly (authentication, parsing, database operations) but lacks the rich user experience that races and race reports imports provide. Users get no preview of data, no validation feedback, no progress indication, and only a generic success message.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Clubs
    2. Click "📥 Import CSV" button
    3. Select a valid CSV file
    4. Click "Import" button
    5. Observe the import process
    6. Notice lack of preview, validation feedback, or progress indication
  - **Expected Behavior**: 
    1. CSV import should show preview of data before import
    2. Validation feedback should highlight errors in the data
    3. Progress indication should show import status
    4. Success message should provide details about imported records
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
  - **Screenshots/Logs**: Clubs import dialog showing basic functionality without rich UI features
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/components/admin/ClubsImportDialog.tsx` (to be created)
    - **Key functions/methods**: `handleImportCsv`, CSV import UI components, preview and validation logic
    - **Database tables/columns**: N/A - Frontend UI enhancement
    - **API endpoints**: N/A - Frontend UI enhancement
  - **Assigned To**: Developer
  - **Notes**: This is a UI/UX enhancement issue, not a functional bug. The CSV import works correctly with JWT authentication, data parsing, and database operations. The backend is functioning properly. This bug focuses on improving the user experience to match the quality of other import functions.
  - **Related Issues**: UI consistency with races and race reports import functionality
  - **User Impact**: Medium - users can import data but lack visibility into what's happening during the process
  - **Fix Required**: Create rich UI components similar to races/race reports import with preview, validation, and progress feedback
  - **Status**: Open

### **🟡 Medium Priority**

**Bug #24**
- [ ] **Bug Title**: Race CSV import incorrectly creates new records for invalid raceIDs instead of skipping them
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: When importing races via CSV with raceIDs that don't exist in the database, the system correctly identifies that the records will be skipped due to no match, but then proceeds to import them as new records anyway. This creates data integrity issues and contradicts the user's expectation that invalid raceIDs should be skipped.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Click "Import CSV" button
    3. Create a CSV with a raceID that doesn't exist in the database (e.g., id=99999)
    4. Import the CSV
    5. Observe that the system shows the record will be skipped due to no match
    6. Notice that the race is still imported as a new record with a different ID
  - **Expected Behavior**: 
    1. Records with invalid raceIDs should be completely skipped
    2. No new records should be created for invalid raceIDs
    3. System should respect the "willSkip" categorization
    4. User should see clear indication that invalid raceIDs were skipped
    5. Data integrity should be maintained
  - **Actual Behavior**: 
    1. System correctly identifies invalid raceIDs and categorizes them as "willSkip"
    2. But then proceeds to import them as new records anyway
    3. Creates data integrity issues with duplicate or unexpected records
    4. Contradicts the user's expectation and system's own categorization
    5. Poor user experience with misleading skip notifications
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: CSV import showing "willSkip" categorization but still creating new records
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/admin/src/pages/AdminDashboard/ImportCsv/validation.ts`, `web/admin/src/pages/AdminDashboard/ImportCsv/ImportPanel.tsx`
    - **Key functions/methods**: `validateAndTransform`, `categorizeValidRows`, import execution logic
    - **Database tables/columns**: `races` table, race creation logic
    - **API endpoints**: Race creation/update endpoints
  - **Assigned To**: Developer
  - **Notes**: This is a critical data integrity issue. The validation logic correctly identifies invalid raceIDs but the import execution doesn't respect the categorization. This could lead to duplicate records and data inconsistencies.
  - **Related Issues**: Race CSV import validation, data integrity
  - **User Impact**: Medium - affects data integrity and user trust in the import system
  - **Fix Required**: Fix import execution logic to respect "willSkip" categorization and prevent creation of new records for invalid raceIDs
  - **Status**: Open

**Bug #25**
- [ ] **Bug Title**: Bulk delete operations cause screen flashing due to individual delete refreshes
  - **Date Reported**: 2025-01-27
  - **Reporter**: User
  - **Severity**: Low
  - **Status**: Open
  - **Priority**: P3
  - **Description**: When selecting all races and performing bulk delete operations, the screen appears to refresh after each individual delete operation, creating a poor user experience with screen flashing. This makes bulk operations visually jarring and unprofessional.
  - **Steps to Reproduce**:
    1. Go to Admin Dashboard → Races
    2. Select all races using the "Select All" checkbox
    3. Click the delete button to perform bulk delete
    4. Observe that the screen flashes/refreshes after each individual delete
    5. Notice the poor visual experience during bulk operations
  - **Expected Behavior**:
    1. Bulk delete should process all selected items without individual screen refreshes
    2. Single refresh should occur after all deletions are complete
    3. Smooth, professional user experience during bulk operations
    4. Progress indicator should show bulk operation status
    5. No screen flashing or jarring visual effects
  - **Actual Behavior**:
    1. Screen refreshes after each individual delete operation
    2. Visual flashing effect during bulk operations
    3. Poor user experience that appears unprofessional
    4. No smooth bulk operation handling
    5. Individual operations are processed sequentially with refreshes
  - **Environment**:
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Screen flashing during bulk delete operations
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/admin/src/pages/AdminDashboard/AdminRacesPage.tsx`, bulk delete functionality
    - **Key functions/methods**: Bulk delete handler, individual delete operations, state management
    - **Database tables/columns**: `races` table, delete operations
    - **API endpoints**: Bulk delete endpoints, individual delete endpoints
  - **Assigned To**: Developer
  - **Notes**: This is a UX improvement issue. The bulk delete functionality works correctly but creates a poor visual experience due to individual operation refreshes. This should be optimized to process bulk operations without individual screen refreshes.
  - **Related Issues**: Bulk operations UX, screen refresh optimization
  - **User Impact**: Low - affects user experience during bulk operations but doesn't break functionality
  - **Fix Required**: Optimize bulk delete operations to prevent individual screen refreshes and provide smooth bulk operation experience
  - **Status**: Open

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
    5. Notice that the page refreshes and returns to the top
    6. User has to scroll/search again to find the edited item
  - **Expected Behavior**:
    1. After saving, user should remain on the same row they were editing
    2. The edited item should be highlighted or visible
    3. User should not lose their place in the list
    4. Smooth user experience for editing multiple items
  - **Actual Behavior**:
    1. Page refreshes and returns to top after save
    2. User loses their position in the list
    3. User has to scroll/search to find the edited item
    4. Poor user experience for editing multiple items
  - **Environment**:
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: User losing position after edit operations
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/pages/AdminDashboard/AdminClubsPage.tsx`, `web/src/pages/AdminDashboard/AdminRaceReportsPage.tsx`
    - **Key functions/methods**: Edit form submission, page refresh logic, state management
    - **Database tables/columns**: N/A - Frontend UX issue
    - **API endpoints**: N/A - Frontend UX issue
  - **Assigned To**: Developer
  - **Notes**: This is a UX improvement issue. The edit functionality works correctly, but the user experience could be improved by maintaining the user's position in the list after editing.
  - **Related Issues**: User experience improvements, list navigation
  - **User Impact**: Low - affects user convenience but doesn't break functionality
  - **Fix Required**: Implement position tracking and return user to edited row after save
  - **Status**: Open

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
    3. Notice that multiple distances are concatenated without proper spacing
    4. Observe that it's hard to read the individual distances
  - **Expected Behavior**:
    1. Multiple distances should be properly separated
    2. "5K, Half Marathon" or "5K Half Marathon" format
    3. Clear readability of individual distances
    4. Consistent formatting across all race entries
  - **Actual Behavior**:
    1. Multiple distances concatenated without spacing
    2. "5KHalf Marathon" format is hard to read
    3. Inconsistent formatting
    4. Poor user experience for reading race information
  - **Environment**:
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Distance column showing concatenated values without proper spacing
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, race table rendering logic
    - **Key functions/methods**: Distance column rendering, data formatting
    - **Database tables/columns**: `races` table, `distance` field formatting
    - **API endpoints**: N/A - Frontend display issue
  - **Assigned To**: Developer
  - **Notes**: This is a display formatting issue. The data is stored correctly in the database, but the frontend display needs better formatting for multiple distance values.
  - **Related Issues**: Data display formatting, user experience improvements
  - **User Impact**: Low - affects readability but doesn't break functionality
  - **Fix Required**: Update distance column formatting to properly separate multiple values
  - **Status**: Open

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
    2. Look at the races table
    3. Notice checkboxes next to each delete button
    4. Try to understand their purpose
    5. Observe that there's no bulk selection functionality
  - **Expected Behavior**:
    1. Either implement bulk selection functionality, OR
    2. Remove unnecessary checkboxes if not needed
    3. Clear purpose for any UI elements
    4. Consistent user experience
  - **Actual Behavior**:
    1. Checkboxes present but no bulk functionality
    2. Unclear purpose for the checkboxes
    3. Potential UI confusion for users
    4. Unnecessary complexity if not needed
  - **Environment**:
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Races table showing checkboxes without bulk functionality
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, race table component
    - **Key functions/methods**: Checkbox rendering, bulk selection logic
    - **Database tables/columns**: N/A - Frontend UI investigation
    - **API endpoints**: N/A - Frontend UI investigation
  - **Assigned To**: Developer
  - **Notes**: This is an investigation task to determine if bulk selection functionality is needed or if the checkboxes should be removed. The current implementation suggests bulk functionality was planned but not implemented.
  - **Related Issues**: UI consistency, bulk operations planning
  - **User Impact**: Low - affects UI clarity but doesn't break functionality
  - **Fix Required**: Investigate and either implement bulk selection or remove unnecessary checkboxes
  - **Status**: Open

### **🟢 Low Priority**

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
    3. Start services: `docker-compose up -d`
    4. Verify database is completely clean
    5. Test that application works with fresh database
    6. Verify all tables are empty and ready for new data
  - **Expected Behavior**: 
    1. Nuclear reset should completely clean the database
    2. All tables should be empty after reset
    3. Application should work normally with fresh database
    4. No leftover data from previous testing
    5. Clean slate for new testing scenarios
  - **Actual Behavior**: 
    1. Nuclear reset process needs testing
    2. Verification that all data is properly cleaned
    3. Confirmation that application works with fresh database
    4. Testing of the complete reset workflow
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: Docker, Docker Compose
  - **Screenshots/Logs**: Nuclear reset process testing and verification
  - **Suggested Code Locations**:
    - **Files to investigate**: `infra/docker-compose.yml`, database initialization scripts
    - **Key functions/methods**: Database reset process, volume cleanup
    - **Database tables/columns**: All tables should be empty after reset
    - **API endpoints**: N/A - Testing infrastructure
  - **Assigned To**: Developer
  - **Notes**: This is a testing task, not a bug fix. The goal is to verify the nuclear reset option works correctly for future testing scenarios. This will help ensure clean testing environments.
  - **Related Issues**: Performance testing cleanup, large dataset testing
  - **User Impact**: Low - testing infrastructure improvement
  - **Fix Required**: Test and verify nuclear reset process
  - **Status**: Open

---

## 📊 **Summary**

- **Total Open Bugs**: 10
- **Critical Priority (P1)**: 0
- **High Priority (P2)**: 1  
- **Medium Priority (P3)**: 4
- **Low Priority (P4)**: 5

### **Next Actions**
1. **Bug #24** - Race CSV import invalid raceID handling (P2)
2. **Bug #25** - Bulk delete screen flashing (P3)
3. **Bug #13** - Clubs CSV import rich UI experience (P4)
4. **Bug #3** - Edit operations return to row position (P3)
5. **Bug #4** - Distance column formatting (P3)
6. **Bug #23** - Investigate race table checkboxes (P3)
7. **Bug #20** - Clubs CSV template download (P4)
8. **Bug #19** - Race CSV surface validation case sensitivity (P4)
9. **Bug #18** - Error banner persistence (P4)
10. **Bug #16** - Test nuclear database reset (P4)
