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

### 3. Login with Demo Credentials

**Program Director (Full Access):**
- Email: `daniel.okon@tokoacademy.org`
- Password: `admin123`

**Instructor (Limited Access):**
- Email: `instructor@tokoacademy.org`
- Password: `instructor123`

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

✅ **Realistic Mock Data:**
- Nigerian context (WAT timezone, real names, locations)
- 3 streams, 4 cohorts, multiple sessions, assignments, students

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
├── data/
│   └── mockData.js    # All mock data
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
