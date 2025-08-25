# 🏃‍♂️ Clubs Feature Verification Guide

This guide provides step-by-step instructions to verify that the Clubs feature has been implemented correctly across all components.

## 🎯 **What Was Implemented**

The Clubs feature adds first-class support for running clubs with:
- **Database**: `clubs` table with constraints and seed data
- **Backend**: FastAPI endpoints for CRUD operations
- **Web**: Public clubs page and admin management
- **Mobile**: Clubs tab in the mobile app
- **CLI**: Import/export scripts for data management

## 🗄️ **1. Database Migration and Seeds**

### **Run Migration**
```bash
cd infra
docker-compose up -d
```

### **Verify Database**
```bash
# Connect to database and check clubs table
docker-compose exec db psql -U rh_user -d runhou -c "\dt clubs"

# Check seeded data
docker-compose exec db psql -U rh_user -d runhou -c "SELECT * FROM clubs;"
```

**Expected Result**: Table `clubs` exists with 6 seeded Houston-area running clubs.

## 🔌 **2. Backend API Endpoints**

### **Start API Server**
```bash
cd api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Test Public Endpoint**
```bash
curl http://localhost:8000/clubs
```

**Expected Result**: JSON array of clubs with `id`, `club_name`, `location`, `website_url`.

### **Test Admin Endpoints**
```bash
# First get admin token
curl -X POST http://localhost:8000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token to test admin endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/admin/clubs
```

## 🌐 **3. Web Frontend**

### **Start Web App**
```bash
cd web
npm run dev
```

### **Navigate to Public Clubs Page**
1. Open `http://localhost:5173/clubs`
2. **Expected**: Page displays all clubs in card format
3. **Expected**: Each club shows name, location, and website button
4. **Expected**: Website buttons open external links

### **Navigate to Admin Dashboard**
1. Go to `http://localhost:5173/admin`
2. Login with admin credentials
3. Click the **"🏃‍♂️ Clubs"** tab
4. **Expected**: Table showing all clubs with CRUD buttons
5. **Expected**: "Add Club" button opens create form
6. **Expected**: "Export CSV" button downloads clubs data

### **Test CRUD Operations**
1. **Create**: Click "Add Club" → Fill form → Submit
2. **Edit**: Click "Edit" on any club → Modify → Submit
3. **Delete**: Click "Delete" on any club → Confirm
4. **Expected**: All operations work without errors

## 📱 **4. Mobile App**

### **Start Mobile App**
```bash
cd mobile
npm start
```

### **Navigate to Clubs Tab**
1. Open the mobile app
2. Tap the **"🏃‍♂️ Clubs"** tab at the bottom
3. **Expected**: List of clubs with pull-to-refresh
4. **Expected**: Each club shows name, location, website button
5. **Expected**: Website buttons open in browser

## 💻 **5. CLI Import/Export**

### **Test Export**
```bash
python export_clubs.py
```

**Expected Result**: Creates `clubs.csv` with all clubs data.

### **Test Import**
```bash
# Create a test CSV file
echo "id,club_name,location,website_url" > test_clubs.csv
echo "7,Test Club,Test City,https://testclub.com" >> test_clubs.csv

# Import the CSV
python import_clubs.py test_clubs.csv
```

**Expected Result**: Club is imported successfully.

## 🧪 **6. Unit Tests**

### **Run All Tests**
```bash
python tests/run_all_tests.py
```

### **Run Clubs Tests Specifically**
```bash
python tests/003_clubs_api_test.py
```

**Expected Result**: All tests pass with green checkmarks.

## 🔍 **7. Verification Checklist**

- [ ] **Database**: `clubs` table exists with seed data
- [ ] **API**: `/clubs` endpoint returns club list
- [ ] **API**: `/admin/clubs` endpoint requires authentication
- [ ] **Web Public**: `/clubs` page displays clubs correctly
- [ ] **Web Admin**: Clubs tab shows in AdminDashboard
- [ ] **Web Admin**: CRUD operations work (Create, Read, Update, Delete)
- [ ] **Web Admin**: CSV export downloads clubs data
- [ ] **Mobile**: Clubs tab shows in bottom navigation
- [ ] **Mobile**: Clubs list displays correctly
- [ ] **CLI**: `export_clubs.py` creates CSV file
- [ ] **CLI**: `import_clubs.py` imports CSV data
- [ ] **Tests**: All unit tests pass

## 🚨 **8. Common Issues & Solutions**

### **Database Connection Error**
- **Issue**: "Could not connect to database"
- **Solution**: Ensure Docker is running and `docker-compose up -d` executed

### **API Not Found Error**
- **Issue**: "404 Not Found" for `/clubs`
- **Solution**: Check that API server is running on port 8000

### **Authentication Error**
- **Issue**: "401 Unauthorized" for admin endpoints
- **Solution**: Verify admin credentials and token format

### **Import/Export Errors**
- **Issue**: CSV import fails
- **Solution**: Check CSV format matches expected headers: `id,club_name,location,website_url`

## 🎉 **9. Success Indicators**

When everything is working correctly, you should see:

1. **6 seeded clubs** in the database
2. **Public clubs page** displaying all clubs with website links
3. **Admin clubs tab** with full CRUD functionality
4. **Mobile clubs tab** showing the same data
5. **All unit tests passing** with green checkmarks
6. **CSV import/export** working without errors

## 📞 **10. Getting Help**

If you encounter issues:

1. Check the terminal output for error messages
2. Verify all services are running (Docker, API, Web, Mobile)
3. Check the browser console for JavaScript errors
4. Review the test output for specific failure details
5. Ensure the database migration ran successfully

---

**Last Updated**: 2025-01-27  
**Feature Status**: ✅ Complete  
**Test Coverage**: ✅ Full unit test suite
