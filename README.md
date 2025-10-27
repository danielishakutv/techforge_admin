# TechForge Bootcamp - Admin Portal

A complete, production-quality admin portal for managing **TechForge Bootcamp**, part of **Toko Academy**. This is the first version of the admin-facing web application, designed for program directors and instructors to manage students, cohorts, sessions, assignments, certificates, and announcements.

---

## Overview

The Admin Portal is a **completely separate web application** from the student portal. It authenticates admins and instructors and will eventually consume the same backend API (PHP + MySQL), especially `/admin/*` and instructor-level endpoints.

**This repository contains only the frontend code.**

---

## Tech Stack

- **React 18** – Modern functional components with hooks
- **React Router v6** – Client-side routing and navigation
- **Tailwind CSS** – Utility-first CSS framework for modern, responsive UI
- **Local State Management** – Using React hooks (`useState`, `useContext`)
- **Mock Data** – Realistic Nigerian bootcamp data for demo purposes

---

## Features

The Admin Portal enables program staff and instructors to:

### 1. **Dashboard**
- View key metrics (active cohorts, total students, attendance, assignments pending grading)
- See upcoming sessions at a glance
- Monitor alerts and cohort performance

### 2. **Cohorts & Streams**
- Manage **Streams** (program tracks like Web Development, AI Essentials, Data Analysis & Visualization)
- Create and manage **Cohorts** (specific intakes with start/end dates, lead instructor, enrollment count)
- View cohort details including attendance rate, average progress, and certificate eligibility stats

### 3. **Sessions & Attendance**
- Schedule live/physical sessions for each cohort
- Track session details (topic, instructor, delivery mode: Online/Physical/Recording, meeting link/venue)
- Mark and update attendance per session (Present, Late, Absent)

### 4. **Assignments & Grading**
- Create assignments with:
  - **Response Type**: Link (Google Drive, GitHub, Figma) OR Text/Write-up
  - Reference material links
  - Due date/time
- View all submissions per assignment
- Grade submissions with score and feedback
- Request resubmission if needed

### 5. **Students**
- Search and filter students by name, email, stream, cohort, status
- View detailed student profiles:
  - Personal details (name, gender, DOB, location, phone, email)
  - Enrollment info (stream, cohort, enrollment date, status)
  - Performance (course progress %, attendance rate)
  - Certificate eligibility

### 6. **Certificates**
- Track certificate eligibility for all students
- Issue certificates to eligible students
- Auto-generate certificate numbers (e.g., `TFB-WD-2025-00127`)
- View and download issued certificates
- Revoke certificates (admin only)

### 7. **Announcements**
- Broadcast announcements to:
  - **All Active Students (General)**
  - **Specific Course/Stream**
- See delivery count and recently sent announcements

### 8. **Settings**
- Academy-level configuration:
  - Organization name, program brand, time zone, support email
  - Attendance policy (min % required for certificate)
  - Assignment policy (require all graded before issuing certificate)
  - UI theme (Light/Dark mode)

### 9. **Admin Account**
- View and manage personal account details
- Change password (with eye-toggle for visibility)
- Enable/disable 2FA (mock toggle)
- See last login info and assigned streams

---

## Role-Based Access

The portal supports two user roles:

1. **Program Director / Admin** (`isAdmin: true`)
   - Full access to all features
   - Can issue/revoke certificates globally
   - Can send announcements to all students

2. **Instructor** (`isAdmin: false`)
   - Limited access to assigned streams/cohorts
   - Can manage sessions, grade assignments, view students in their cohorts

Role-based rendering is already structured in the UI code (e.g., checking `adminUser.isAdmin` before showing certain actions).

---

## Installation & Setup

### Prerequisites

- **Node.js 16+** and **npm** or **yarn**

### Steps

1. **Clone or download this repository**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

4. **Login**

   Use the demo credentials:

   - **Admin**: `daniel.okon@tokoacademy.org` / `admin123`
   - **Instructor**: `instructor@tokoacademy.org` / `instructor123`

---

## Deployment

This portal is configured to be deployed at **https://bootcamp.tokoacademy.org/admin**

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Deployment Configuration

The app is configured with:
- **Base URL**: `/admin` (set in `App.jsx` router basename)
- **Homepage**: `https://bootcamp.tokoacademy.org/admin` (set in `package.json`)
- **API Base URL**: `https://api.bootcamp.tokoacademy.org` (set in `.env.production`)

### Server Configuration

For the admin portal to work correctly at `/admin`, ensure your server:

1. **Serves the build folder** at `/admin`
2. **Redirects all `/admin/*` routes** to `/admin/index.html` for client-side routing

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
```

#### Nginx
```nginx
location /admin {
  alias /var/www/admin-portal/build;
  try_files $uri $uri/ /admin/index.html;
}
```

#### Node.js/Express
```javascript
app.use('/admin', express.static(path.join(__dirname, 'build')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AdminLayout.jsx       # Main layout wrapper (sidebar + top bar)
│   │   ├── SidebarNav.jsx        # Left sidebar navigation
│   │   ├── TopBar.jsx            # Top header with search, notifications, user dropdown
│   │   └── PageHeader.jsx        # Reusable page title/actions component
│   ├── ui/
│   │   ├── Card.jsx              # Base card component
│   │   ├── StatCard.jsx          # KPI stat card
│   │   ├── StatusBadge.jsx       # Status badge (Ongoing, Completed, Graded, etc.)
│   │   ├── ProgressBar.jsx       # Mini progress bar
│   │   ├── DataTable.jsx         # Generic table with click handlers
│   │   ├── Modal.jsx             # Modal overlay component
│   │   ├── Drawer.jsx            # Side drawer component
│   │   ├── LabeledInput.jsx      # Form input with label
│   │   ├── LabeledSelect.jsx     # Form select with label
│   │   ├── LabeledTextarea.jsx   # Textarea with label
│   │   ├── PasswordInput.jsx     # Password input with eye toggle
│   │   ├── ToggleSwitch.jsx      # Toggle switch component
│   │   └── AnnouncementAudienceBadge.jsx  # Badge for announcement audience type
│   └── ProtectedRoute.jsx        # HOC for protecting authenticated routes
├── contexts/
│   └── AuthContext.jsx           # Authentication context (login, logout, user state)
├── data/                         # (removed) demos and mock data were removed — app is API-driven
├── pages/
│   ├── LoginPage.jsx             # Login page
│   ├── DashboardPage.jsx         # Dashboard with KPIs and upcoming sessions
│   ├── CohortsPage.jsx           # Manage streams and cohorts
│   ├── SessionsPage.jsx          # Schedule sessions and mark attendance
│   ├── AssignmentsPage.jsx       # Create assignments and grade submissions
│   ├── StudentsPage.jsx          # View and manage students
│   ├── CertificatesPage.jsx      # Track and issue certificates
│   ├── AnnouncementsPage.jsx     # Broadcast announcements
│   ├── SettingsPage.jsx          # Academy settings
│   └── AccountPage.jsx           # Admin account management
├── App.jsx                       # Main app with routing
├── index.jsx                     # React entry point
└── index.css                     # Tailwind CSS imports
```

---

## How It Will Connect to the Backend

All data is fetched from the backend API. The frontend calls the endpoints listed below via the centralized helper at `src/utils/api.js`. Authentication is handled with a JWT stored in `localStorage` and sent as a Bearer token on each request.

### Backend API Endpoints (Expected)

The portal is structured to consume these endpoints:

**Authentication**
- `POST /api/admin/login` – Admin/instructor login

**Cohorts & Streams**
- `GET /api/admin/streams` – List all streams
- `POST /api/admin/streams` – Create a new stream
- `GET /api/admin/cohorts` – List all cohorts
- `POST /api/admin/cohorts` – Create a new cohort
- `GET /api/admin/cohorts/{id}` – Get cohort details
- `PATCH /api/admin/cohorts/{id}` – Update cohort

**Sessions & Attendance**
- `GET /api/admin/sessions` – List all sessions
- `POST /api/admin/sessions` – Schedule a new session
- `GET /api/admin/sessions/{id}` – Get session details
- `POST /api/attendance/mark` – Mark/update attendance

**Assignments & Grading**
- `GET /api/admin/assignments` – List all assignments
- `POST /api/admin/assignments` – Create a new assignment
- `GET /api/admin/assignments/{id}` – Get assignment details
- `POST /api/submissions/{submission_id}/grade` – Grade a submission

**Students**
- `GET /api/admin/students` – List all students
- `GET /api/admin/students/{id}` – Get student profile
- `PATCH /api/admin/students/{id}` – Update student status

**Certificates**
- `GET /api/admin/certificates` – List all certificate records
- `POST /api/admin/certificates/issue` – Issue a certificate to a student
- `DELETE /api/admin/certificates/{id}` – Revoke a certificate

**Announcements**
- `POST /api/admin/announcements/broadcast` – Send an announcement
- `GET /api/admin/announcements/recent` – Get recently sent announcements

### Authentication

The portal will send a **Bearer token** in the `Authorization` header for all authenticated requests:

```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
}
```

You'll store the token in `localStorage` after successful login and include it in every API call.

---

## Data and Backend

This project is API-first: there are no demo data sources baked into the app. All entities (streams, cohorts, sessions, students, assignments, certificates, announcements) are fetched from the backend API endpoints described above. Configure `REACT_APP_API_BASE_URL` in your environment and ensure the backend issues JWT tokens via `/auth/login` for authentication.

---

## Design Principles

- **Light Theme by Default**: Clean, modern, minimal design with soft shadows and rounded cards
- **Confident & Professional**: Not playful; uses clear typography and purposeful spacing
- **Desktop-First, Tablet-Usable**: Optimized for desktop workflow, responsive on tablets
- **Nigerian Context**: All data uses realistic Nigerian names, cities, phone numbers, and time zone (WAT)
- **No Lorem Ipsum**: All text is realistic and contextual

---

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build/` folder

### `npm test`
Launches the test runner (if configured)

---

## Future Enhancements

When connecting to the backend:

1. Replace all mock data with API calls
2. Add proper error handling and loading states
3. Implement actual authentication with JWT tokens
4. Add pagination and infinite scroll for large datasets
5. Implement search/filter on the backend side
6. Add real-time notifications using WebSockets or polling
7. Integrate PDF generation for certificates
8. Add file upload support if needed (currently students submit links or text only)

---

## License

This project is proprietary to **Toko Academy**. Unauthorized distribution is prohibited.

---

## Contact

For questions or support, contact:
- **Email**: support@tokoacademy.org
- **Developer**: TechForge Development Team

---

**Built with ❤️ for Nigerian tech learners.**
