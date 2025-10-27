# Quick Start Guide - TechForge Admin Portal

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

The app will automatically open at http://localhost:3000

### 3. Login

The app expects an operational backend that issues JWT tokens from `/auth/login`. Configure `REACT_APP_API_BASE_URL` and sign in with a valid admin/instructor account provided by your backend.

---

## 📋 What's Included

✅ **9 Complete Pages:**
- Dashboard with KPIs and alerts
- Cohorts & Streams management
- Sessions & Attendance tracking
- Assignments & Grading (link/text submissions)
- Students directory with profiles
- Certificates tracking and issuance
- Announcements (general or stream-specific)
- Settings (academy policies)
- Admin Account management

✅ **15+ Reusable UI Components:**
- Card, StatCard, DataTable, Modal, Drawer
- Form inputs (text, select, textarea, password with eye toggle)
- StatusBadge, ProgressBar, ToggleSwitch
- And more...

✅ **Role-Based Access:**
- Admin: Full access to all features
- Instructor: Limited to assigned streams/cohorts

✅ **API-driven Data:**
All data is loaded from the backend API. There is no local mock data included by default.

---

## 🎨 Key Features to Explore

### Assignments Page - NEW Logic
- **Response Type**: Students submit either a LINK or TEXT
- No file uploads - they paste links (Google Drive, GitHub, Figma) or write text responses
- Grading interface displays the appropriate submission type

### Announcements Page - NEW Logic
- **Audience Type**: Send to all students OR specific stream only
- Track delivery count for each announcement
- Recently sent announcements history

### Certificates
- Auto-generate certificate numbers (e.g., TFB-WD-2025-00127)
- Track eligibility based on attendance and assignments
- Issue and revoke certificates (admin only)

---

## 🔧 Next Steps (Backend Integration)

When your PHP backend is ready:

1. Replace mock data imports with API calls
2. Add authentication token handling
3. Implement error handling and loading states
4. See README.md for full list of expected API endpoints

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/        # AdminLayout, SidebarNav, TopBar
│   ├── ui/            # Reusable UI components
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── data/              # (removed) demo/mock data (app is API-driven)
├── pages/             # 9 complete pages
├── App.jsx            # Routing configuration
└── index.jsx          # React entry point
```

---

## 🎯 Built With

- React 18
- React Router v6
- Tailwind CSS
- Local state management (hooks + context)

---

**Need help?** Check the full README.md for detailed documentation.

**Built for Toko Academy TechForge Bootcamp** 🇳🇬
