# 🐛 Bug Tracking & Issue Log

## 📋 **Current Active Bugs**

### **🔴 Critical Priority**

**Bug #1**
- [ ] **Bug Title**: Race report editing critical issues - missing ID display, race ID validation, and deletion cascade problems
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Critical
  - **Status**: Open
  - **Priority**: P1
  - **Description**: Multiple critical issues with race report editing and race deletion that affect data integrity and user experience:
    1. Edit race report form does not display the race report ID
    2. Race ID field should allow null values for orphaned reports
    3. Race report ID should gracefully resolve to null when editing if the referenced race doesn't exist
    4. When deleting a race, the system should look for referencing race reports and allow race_id to resolve to null instead of blocking deletion
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Race Reports
    2. Click "Edit" on any race report
    3. Notice the form doesn't show the race report ID
    4. Try to delete a race that has race reports referencing it
    5. Observe deletion is blocked due to foreign key constraints
  - **Expected Behavior**: 
    1. Edit form should display race report ID for reference
    2. Race ID field should accept null values
    3. Orphaned race reports should handle missing races gracefully
    4. Race deletion should cascade or allow race_id to be set to null
  - **Actual Behavior**: 
    1. No ID display in edit form
    2. Race ID field doesn't allow null
    3. System crashes when referenced race doesn't exist
    4. Race deletion blocked by foreign key constraints
  - **Environment**: 
     - **OS**: Windows 10
     - **Browser**: Any modern browser
     - **Python Version**: 3.11.9
     - **Database**: PostgreSQL
     - **Other Dependencies**: React, TypeScript, FastAPI
   - **Screenshots/Logs**: 409 Conflict errors, foreign key constraint violations
   - **Suggested Code Locations**:
     - **Files to investigate**: `web/src/components/admin/RaceReportForm.tsx`, `api/app/main.py`, `infra/initdb/010_create_race_reports.sql`
     - **Key functions/methods**: `update_race_report`, `delete_race`, race report form rendering
     - **Database tables/columns**: `race_reports` table, `race_id` foreign key constraint
     - **API endpoints**: PUT `/race_reports/{id}`, DELETE `/races/{id}`
   - **Assigned To**: Developer
   - **Notes**: This is a critical data integrity issue that affects the core functionality of race reports. The system needs proper handling of orphaned reports and graceful degradation when referenced races are deleted.
   - **Related Issues**: Affects race report editing, race deletion, data integrity
   - **User Impact**: Critical - users cannot properly edit race reports or delete races with reports

### **🔴 High Priority**
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

**Bug #2**
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

**Bug #3**
- [ ] **Bug Title**: Incomplete Select All functionality in races table - missing header checkbox
  - **Date Reported**: 2025-01-27
  - **Reporter**: Developer
  - **Severity**: Medium
  - **Status**: Open
  - **Priority**: P2
  - **Description**: The races table has Select All functionality but is missing the standard table header checkbox for bulk selection. Users can manually check individual checkboxes and use the "Select All" button, but there's no visual checkbox in the table header to indicate selection state.
  - **Steps to Reproduce**: 
    1. Go to Admin Dashboard → Races
    2. Observe the races table with individual row checkboxes
    3. Notice there's no checkbox in the table header (Actions column header)
    4. Click "Select All" button - races get selected but no visual feedback in header
    5. Try to deselect all - no header checkbox to uncheck
  - **Expected Behavior**: Table header should have a checkbox that shows checked when all races are selected, unchecked when none are selected, and indeterminate (dash) when some races are selected. Clicking it should toggle between selecting all and selecting none.
  - **Actual Behavior**: No header checkbox exists. Users must rely on the "Select All" button and individual checkboxes, which is not the standard UX pattern for data tables.
  - **Environment**: 
    - **OS**: Windows 10
    - **Browser**: Any modern browser
    - **Python Version**: 3.11.9
    - **Database**: PostgreSQL
    - **Other Dependencies**: React, TypeScript, FastAPI
  - **Screenshots/Logs**: Races table showing missing header checkbox
  - **Suggested Code Locations**:
    - **Files to investigate**: `web/src/pages/AdminDashboard/AdminRacesPage.tsx`, `web/src/pages/AdminDashboard/BulkBar.tsx`
    - **Key functions/methods**: `selectAllRaces()`, `clearSelection()`, table header rendering
    - **Database tables/columns**: N/A (frontend UX issue)
    - **API endpoints**: N/A (frontend UX issue)
  - **Assigned To**: Developer
  - **Notes**: This is a UX bug that affects user experience. The Select All functionality exists but is incomplete without the standard header checkbox pattern. Users expect to see a checkbox in the table header for bulk selection operations.
  - **Related Issues**: Bulk delete functionality works correctly, individual selection works correctly

**Bug #4**
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

**Bug #5**
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

**Bug #6**
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

**Bug #7**
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

- [ ] **Bug Title**: Mobile app "All" filter should show all races past and present

**Bug #8**
- [ ] **Bug Title**: MD file organization and cleanup needed - obsolete files and poor structure
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
