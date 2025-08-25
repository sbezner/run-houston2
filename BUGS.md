# 🐛 Bug Tracking & Issue Log

## 📋 **Current Active Bugs**

### **🔴 High Priority**
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
| 🔴 Open | 0 | 0% |
| 🟡 In Progress | 0 | 0% |
| 🟢 Fixed | 2 | 100% |
| ✅ Closed | 0 | 0% |
| ❌ Won't Fix | 0 | 0% |
| **Total** | **2** | **100%** |

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
*Total Bugs Tracked: 2*
*Bugs Fixed: 2*
