# Weekend Action Plan - Complete MVP 1 + Web Frontend

## 🎯 **Phase 0: Complete MVP 1 (Saturday Morning - 2 hours)**

### **Task 0.1: Missing MVP 1 Elements**
- [ ] **Add version constants** to mobile app
  - Create `APP_VERSION` constant
  - Create `DB_VERSION` constant
  - Add to mobile app config

- [ ] **Implement About screen** in mobile app
  - Create About screen component
  - Display App Version and DB Version
  - Add navigation to About screen
  - Test version display

## 🎯 **Phase 1: Backend API Enhancements (Saturday Afternoon - 4 hours)**

### **Task 1.1: Database Schema Updates**
- [ ] **Add admin_users table** to database
  - Create migration script for new table
  - Add password hashing functionality
  - Test admin user creation

### **Task 1.2: New API Endpoints**
- [ ] **Implement admin authentication** (`POST /admin/login`)
  - Add JWT token generation
  - Secure password handling
  - Session management

- [ ] **Add race CRUD endpoints**
  - `POST /races` - Create new race
  - `PUT /races/{id}` - Update existing race  
  - `DELETE /races/{id}` - Delete race
  - `GET /admin/races` - Admin view (all races)

- [ ] **Add admin middleware** for protected routes
  - JWT token validation
  - Admin role verification

### **Task 1.3: Enhanced Data Validation**
- [ ] **Improve race data validation**
  - Required field validation
  - Date format validation
  - URL validation for websites
  - GPS coordinate validation

## 🎨 **Phase 2: Web Frontend Foundation (Sunday - 6 hours)**

### **Task 2.1: Project Setup**
- [ ] **Create web frontend directory** (`web/`)
- [ ] **Choose frontend framework** (React recommended)
- [ ] **Set up build system** (Vite or Create React App)
- [ ] **Configure routing** (React Router)

### **Task 2.2: Basic Structure**
- [ ] **Create component architecture**
  - Layout components
  - Navigation components
  - Page components
- [ ] **Set up state management** (Context API or Redux)
- [ ] **Configure API client** for backend communication

## 🌐 **Phase 3: Marketing Website (Sunday - 3 hours)**

### **Task 3.1: Landing Page**
- [ ] **Design hero section** with app name and tagline
- [ ] **Create feature highlights** section
- [ ] **Add app screenshots/demo** section
- [ ] **Implement download buttons** for app stores

### **Task 3.2: Content & Styling**
- [ ] **Write compelling copy** about the app
- [ ] **Design responsive layout** (mobile-first)
- [ ] **Add contact information** section
- [ ] **Implement basic SEO** (meta tags, titles)

## 🔐 **Phase 4: Admin Dashboard (Sunday - 4 hours)**

### **Task 4.1: Authentication System**
- [ ] **Create login page** with username/password
- [ ] **Implement JWT token storage** (localStorage)
- [ ] **Add logout functionality**
- [ ] **Create protected route wrapper**

### **Task 4.2: Race Management Interface**
- [ ] **Build race list view** with admin data (no 30-day filter)
- [ ] **Implement basic filtering**:
  - Date range picker
  - City/state dropdowns
  - Surface type checkboxes
  - Kid run toggle
- [ ] **Add search functionality** by race name

### **Task 4.3: CRUD Operations**
- [ ] **Create race form** for adding new races
- [ ] **Build edit race form** for updating existing races
- [ ] **Implement delete confirmation** modal

## 🚀 **Phase 5: Integration & Testing (Monday - 3 hours)**

### **Task 5.1: API Integration**
- [ ] **Connect frontend to new backend endpoints**
- [ ] **Test all CRUD operations** end-to-end
- [ ] **Verify authentication flow** works correctly
- [ ] **Test error handling** and user feedback

### **Task 5.2: Final Testing**
- [ ] **Test marketing website** functionality
- [ ] **Verify admin dashboard** works correctly
- [ ] **Test mobile app** with new features
- [ ] **Check responsive design** on different devices

## 🌍 **Phase 6: Deployment Prep (Monday - 2 hours)**

### **Task 6.1: Production Ready**
- [ ] **Build production version** of web frontend
- [ ] **Configure for Render hosting**
- [ ] **Test production build**
- [ ] **Prepare deployment instructions**

## 📋 **Weekend Sprint Timeline**

### **Saturday (8 hours)**
- **Morning (2h)**: Complete MVP 1 (About screen + version constants)
- **Afternoon (4h)**: Backend API enhancements
- **Evening (2h)**: Testing and debugging

### **Sunday (13 hours)**
- **Morning (6h)**: Web frontend foundation
- **Afternoon (3h)**: Marketing website
- **Evening (4h)**: Admin dashboard

### **Monday (5 hours)**
- **Morning (3h)**: Integration & testing
- **Afternoon (2h)**: Production preparation

**Total Weekend Time**: 26 hours
**Current Status**: Ready to begin Phase 0 (Complete MVP 1)

## 🎯 **Success Metrics**

- [ ] **MVP 1 Complete**: About screen shows App Version and DB Version
- [ ] **Admin can log in** and access dashboard
- [ ] **All CRUD operations** work correctly
- [ ] **Marketing website** loads and displays app information
- [ ] **Web frontend is responsive** on all devices
- [ ] **Production ready** for deployment

## 🚀 **Weekend Goals**

✅ **Saturday Night**: Complete MVP 1 + working backend with admin auth
✅ **Sunday Night**: Functional web admin interface + marketing site
✅ **Monday**: Production-ready and tested system

---
*Last updated: 2025-08-15*
*Next Action: Start with Task 0.1 (Complete MVP 1 - Add version constants)*
