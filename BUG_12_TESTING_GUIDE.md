# Bug #12: JWT Authentication Migration - Comprehensive Testing Guide

## Overview
This guide covers testing the complete migration from mixed authentication (shared secrets + JWT) to exclusive JWT authentication for all admin operations.

## Prerequisites
- Backend API running on http://localhost:8000
- Frontend web app running on http://localhost:5173
- Database accessible and populated with test data
- Admin user credentials available for login

## Pre-Testing Setup
1. **Stop all services** (backend, frontend, database)
2. **Start fresh** with `docker-compose up -d` in the `infra/` directory
3. **Verify backend is accessible**: http://localhost:8000/docs
4. **Verify frontend is accessible**: http://localhost:5173

---

## 1. Authentication Flow Testing ✅ COMPLETED

### 1.1 Login Process ✅
**Steps:**
1. Navigate to http://localhost:5173
2. Click "Admin Login" or navigate to admin area
3. Enter valid admin credentials
4. Submit login form

**Expected Results:**
- Login successful
- Redirected to admin dashboard
- JWT token stored in localStorage
- No console errors

**Debugging:**
- Check browser console for authentication errors
- Verify JWT token in localStorage (DevTools → Application → Local Storage)
- Check backend logs for login attempts

**Sample Test Data:**
```
Username: admin
Password: admin123
```

---

## 2. Races Management Testing

### 2.1 Create Race ✅
**Steps:**
1. Go to Admin Dashboard → Races
2. Click "Create Race" button
3. Fill in race details:
   - Name: "Test Race 2024"
   - Date: "2024-12-25"
   - Location: "Test Location"
   - Distance: "5K"
   - Surface: "Road"
4. Click "Create Race"

**Expected Results:**
- Race created successfully
- Success message displayed
- Race appears in races list
- No authentication errors

**Debugging:**
- Check browser console for API errors
- Verify JWT token in request headers (Network tab)
- Check backend logs for authentication failures

### 2.2 Edit Race ✅
**Steps:**
1. Find "Test Race 2024" in races list
2. Click edit button (pencil icon)
3. Change race name to "Updated Test Race 2024"
4. Click "Update Race"

**Expected Results:**
- Race updated successfully
- Success message displayed
- Race name changed in list
- No authentication errors

### 2.3 Delete Race ✅
**Steps:**
1. Find "Updated Test Race 2024" in races list
2. Click delete button (trash icon)
3. Confirm deletion in modal

**Expected Results:**
- Race deleted successfully
- Success message displayed
- Race removed from list
- No authentication errors

### 2.4 CSV Import Races ✅
**Steps:**
1. Click "Import CSV" button
2. Select a valid CSV file with race data
3. Review validation results
4. Click "Import Valid Races"

**Expected Results:**
- CSV validation successful
- Races imported successfully
- Success message displayed
- New races appear in list
- No authentication errors

**Sample CSV Data:**
```csv
name,date,location,distance,surface
Test Race 1,2024-12-26,Location 1,10K,Road
Test Race 2,2024-12-27,Location 2,5K,Trail
```

---

## 3. Clubs Management Testing ✅ COMPLETED

### 3.1 Create Club ✅
**Steps:**
1. Go to Admin Dashboard → Clubs
2. Click "Create Club" button
3. Fill in club details:
   - Name: "Test Running Club"
   - Location: "Test City"
   - Website: "https://testclub.com"
4. Click "Create Club"

**Expected Results:**
- Club created successfully
- Success message displayed
- Club appears in clubs list
- No authentication errors

### 3.2 Edit Club ✅
**Steps:**
1. Find "Test Running Club" in clubs list
2. Click edit button
3. Change location to "Updated Test City"
4. Click "Update Club"

**Expected Results:**
- Club updated successfully
- Success message displayed
- Location changed in list
- No authentication errors

### 3.3 Delete Club ✅
**Steps:**
1. Find "Test Running Club" in clubs list
2. Click delete button
3. Confirm deletion

**Expected Results:**
- Club deleted successfully
- Success message displayed
- Club removed from list
- No authentication errors

### 3.4 CSV Export Clubs ✅
**Steps:**
1. Click "Export CSV" button
2. Wait for download to complete

**Expected Results:**
- CSV file downloaded successfully
- File contains all clubs data
- No authentication errors

### 3.5 CSV Import Clubs ✅
**Steps:**
1. Click "Import CSV" button
2. Select a valid CSV file with club data
3. Review validation results
4. Click "Import Valid Clubs"

**Expected Results:**
- CSV validation successful
- Clubs imported successfully
- Success message displayed
- New clubs appear in list
- No authentication errors

**Sample CSV Data:**
```csv
club_name,location,website_url
Test Club 1,City 1,https://club1.com
Test Club 2,City 2,https://club2.com
```

---

## 4. Race Reports Management Testing ✅ COMPLETED

### 4.1 Create Race Report ✅
**Steps:**
1. Go to Admin Dashboard → Race Reports
2. Click "Create Report" button
3. Fill in report details:
   - Title: "Test Race Report"
   - Content: "This is a test race report content."
   - Race: Select an existing race
4. Click "Create Report"

**Expected Results:**
- Report created successfully
- Success message displayed
- Report appears in reports list
- No authentication errors

### 4.2 Edit Race Report
**Steps:**
1. Find "Test Race Report" in reports list
2. Click edit button
3. Change title to "Updated Test Race Report"
4. Click "Update Report"

**Expected Results:**
- Report updated successfully
- Success message displayed
- Title changed in list
- No authentication errors

### 4.3 Delete Race Report
**Steps:**
1. Find "Updated Test Race Report" in reports list
2. Click delete button
3. Confirm deletion

**Expected Results:**
- Report deleted successfully
- Success message displayed
- Report removed from list
- No authentication errors

### 4.4 CSV Export Race Reports ✅
**Steps:**
1. Click "Export CSV" button
2. Wait for download to complete

**Expected Results:**
- CSV file downloaded successfully
- File contains all race reports data
- No authentication errors

### 4.5 CSV Import Race Reports ✅
**Steps:**
1. Click "Import CSV" button
2. Select a valid CSV file with race report data
3. Review validation results
4. Click "Import Valid Reports"

**Expected Results:**
- CSV validation successful
- Reports imported successfully
- Success message displayed
- New reports appear in list
- No authentication errors

**Sample CSV Data:**
```csv
title,content,race_id
Test Report 1,Content for report 1,1
Test Report 2,Content for report 2,2
```

---

## 5. Bulk Operations Testing ✅ COMPLETED

### 5.1 Bulk Delete Races ✅
**Steps:**
1. Go to Admin Dashboard → Races
2. Select multiple races using checkboxes
3. Click "Delete Selected" button
4. Confirm bulk deletion

**Expected Results:**
- Selected races deleted successfully
- Success message displayed
- Races removed from list
- No authentication errors

### 5.2 Bulk Delete Clubs ✅
**Steps:**
1. Go to Admin Dashboard → Clubs
2. Select multiple clubs using checkboxes
3. Click "Delete Selected" button
4. Confirm bulk deletion

**Expected Results:**
- Selected clubs deleted successfully
- Success message displayed
- Clubs removed from list
- No authentication errors

### 5.3 Bulk Delete Race Reports ✅
**Steps:**
1. Go to Admin Dashboard → Race Reports
2. Select multiple reports using checkboxes
3. Click "Delete Selected" button
4. Confirm bulk deletion

**Expected Results:**
- Selected reports deleted successfully
- Success message displayed
- Reports removed from list
- No authentication errors

---

## 6. Authentication Error Testing ✅ COMPLETED

### 6.1 Invalid Token ✅
**Steps:**
1. Clear localStorage (DevTools → Application → Local Storage → Clear)
2. Try to perform any admin operation

**Expected Results:**
- Authentication error displayed
- Redirected to login page
- No data modification allowed

### 6.2 Expired Token ✅
**Steps:**
1. Wait for JWT token to expire (if configured)
2. Try to perform any admin operation

**Expected Results:**
- Authentication error displayed
- Redirected to login page
- No data modification allowed

### 6.3 No Token ✅
**Steps:**
1. Logout from admin session
2. Try to access admin endpoints directly via API

**Expected Results:**
- 401 Unauthorized response
- No data access allowed
- Proper error message returned

### 6.4 Valid Token ✅
**Steps:**
1. Login to admin panel and get valid JWT token
2. Make direct API call to admin endpoint with valid token
3. Verify successful data access

**Expected Results:**
- 200 OK response
- Data returned successfully
- Proper authentication working

---

## 7. Public Endpoints Testing

### 7.1 Verify Public Access
**Steps:**
1. Without logging in, access:
   - http://localhost:5173 (home page)
   - http://localhost:5173/races (races list)
   - http://localhost:5173/clubs (clubs list)
   - http://localhost:5173/race_reports (race reports list)

**Expected Results:**
- All public pages accessible
- Data displayed correctly
- No authentication required
- No console errors

### 7.2 Verify Admin Endpoints Protected ✅
**Steps:**
1. Without logging in, try to access:
   - http://localhost:5173/admin
   - http://localhost:8000/admin/races
   - http://localhost:8000/admin/clubs

**Expected Results:**
- Redirected to login page
- No admin data accessible
- Proper authentication required

---

## 8. Mobile App Verification

### 8.1 Check Mobile App Functionality ✅
**Steps:**
1. Open mobile app
2. Navigate to Clubs screen
3. Navigate to Reports screen
4. Verify data loads correctly

**Expected Results:**
- Mobile app functions normally
- No authentication errors
- Data displays correctly
- No changes required

---

## 9. Performance Testing

### 9.1 Large Dataset Operations ✅
**Steps:**
1. Import large CSV files (1000+ records)
2. Perform bulk operations on large datasets
3. Export large datasets

**Expected Results:**
- Operations complete successfully
- Reasonable response times
- No memory issues
- No authentication timeouts

**Status**: ✅ COMPLETED - Successfully imported large number of race reports, system handled bulk operations well

---

## 10. Error Handling Testing

### 10.1 Network Errors ✅
**Steps:**
1. Disconnect network temporarily
2. Try to perform admin operations
3. Reconnect network
4. Retry operations

**Expected Results:**
- Proper error messages displayed
- Operations fail gracefully
- Recovery possible after reconnection

**Status**: ✅ COMPLETED - Network validation working correctly, admin operations properly blocked when offline, clear error messages displayed

### 10.2 Server Errors ✅
**Steps:**
1. Stop backend server temporarily
2. Try to perform admin operations
3. Restart backend server
4. Retry operations

**Expected Results:**
- Proper error messages displayed
- Operations fail gracefully
- Recovery possible after restart

**Status**: ✅ COMPLETED - Server error handling working correctly, admin operations fail gracefully when backend down, recovery successful when server restarts, minor cosmetic issue with error banner persistence

---

## 11. Security Testing

### 11.1 Token Validation ✅
**Steps:**
1. Inspect JWT token in browser
2. Try to modify token manually
3. Attempt to use modified token

**Expected Results:**
- Modified tokens rejected
- Proper security validation
- No unauthorized access allowed

**Status**: ✅ COMPLETED - JWT token validation working correctly, modified tokens properly rejected with "Your session has expired" message and login redirect

### 11.2 Session Management ✅
**Steps:**
1. Login to admin panel
2. Close browser tab
3. Reopen admin panel
4. Verify session state

**Expected Results:**
- Session maintained appropriately
- Proper logout on session expiry
- Secure session handling

**Status**: ✅ COMPLETED - Session management fixed: JWT tokens now stored in sessionStorage, sessions properly terminate when browser closes, fresh browser instances require re-authentication. Security vulnerability resolved.

---

## 12. Final Verification

### 12.1 Complete Workflow Test ✅
**Steps:**
1. Login as admin
2. Create a new race
3. Create a new club
4. Create a new race report
5. Export all data to CSV
6. Import new data from CSV
7. Edit created records
8. Delete test records
9. Logout

**Expected Results:**
- All operations successful
- No authentication errors
- Data consistency maintained
- Clean logout process

**Status**: ✅ COMPLETED - Complete end-to-end workflow test successful, all CRUD operations working, CSV import/export functional, bulk operations working, system performing as expected

---

## Debugging Tips

### Common Issues
1. **JWT Token Not Found**: Check localStorage and auth service
2. **401 Unauthorized**: Verify token validity and expiration
3. **CORS Errors**: Check backend CORS configuration
4. **Network Errors**: Verify backend server is running

### Useful Commands
```bash
# Check backend logs
docker-compose logs api

# Check database logs
docker-compose logs db

# Restart services
docker-compose restart

# View JWT token in browser
localStorage.getItem('jwt_token')
```

### Browser DevTools
- **Network Tab**: Monitor API calls and headers
- **Console Tab**: Check for JavaScript errors
- **Application Tab**: Verify localStorage and session storage
- **Sources Tab**: Debug authentication flow

---

## Success Criteria

The migration is successful when:
✅ All admin operations work with JWT authentication only
✅ No shared secret authentication remains
✅ Public endpoints remain accessible without authentication
✅ Mobile app continues to function normally
✅ All CRUD operations work correctly
✅ CSV import/export functions properly
✅ Bulk operations work as expected
✅ Error handling is appropriate
✅ Security is maintained
✅ Performance is acceptable

---

## Rollback Plan

If issues arise:
1. **Stop all services**
2. **Revert to previous git commit**: `git reset --hard HEAD~1`
3. **Restart services**: `docker-compose up -d`
4. **Verify previous functionality restored**

---

## Support

If you encounter issues during testing:
1. Check this guide for troubleshooting steps
2. Review browser console for error messages
3. Check backend logs for server-side issues
4. Verify database connectivity
5. Ensure all services are running properly
