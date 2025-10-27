# Admin API Reference — TechForge Bootcamp

Last updated: 2025-10-25
Base URL (example): `https://api.bootcamp.tokoacademy.org`

This document contains the full admin-only API reference for the frontend engineer integrating the Admin Portal. It includes endpoint contracts, sample requests and responses, data models, error codes, and recommended integration notes.

---

## Quick notes
- All admin endpoints require Authorization: `Bearer <JWT>` (HMAC-SHA256 signed token).
- Requests and responses use JSON. Use `Content-Type: application/json` and `Accept: application/json`.
- Standard response envelope used across the API:

```json
{
  "success": true,
  "data": { /* payload */ },
  "error": null
}
```

When an error occurs `success` is `false` and `error` contains `{ code, message, details? }`.

---

## Authentication

### POST /auth/login
- Purpose: Admin login to obtain JWT
- Headers: `Content-Type: application/json`
- Body:
```json
{ "email": "admin@tokoacademy.org", "password": "AdminPassword123!" }
```
- Success (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJ...",
    "expires_in": 3600,
    "user": { "id": 1, "email": "admin@tokoacademy.org", "role": "admin", "name": "Toko Admin" }
  },
  "error": null
}
```
- Errors: 400 validation, 401 invalid_credentials

### POST /auth/forgot-password
- Body: `{ "email": "admin@tokoacademy.org" }`
- Success (200): generic message (doesn't reveal existence)

### POST /auth/reset-password
- Body: `{ "token": "reset-token", "password": "NewStrongPassword!" }`
- Success (200): password updated

Auth notes
- Store JWT securely (httpOnly cookie or secure storage). Frontend must send `Authorization` header for each request.
- Backend token expiry may require re-login. There is no refresh token endpoint in this spec.

---

## Conventions
- Pagination: `page` (1-based), `per_page` (default 20, admin may request up to 100).
- Filtering: query parameters (e.g., `q`, `status`, `stream_id`, `cohort_id`).
- Timestamps: ISO 8601 with timezone (e.g., `2025-11-01T09:00:00+00:00`). Convert to local timezone for display.
- Error envelope keys: `code` (machine), `message` (human), `details` (field-level errors) when applicable.

Common error codes
- `validation_failed` (400)
- `invalid_credentials` (401)
- `token_expired` / `invalid_token` (401)
- `insufficient_permissions` (403)
- `resource_not_found` (404)
- `conflict` (409)
- `not_eligible` (400) — e.g. issuing certificate

---

## Admin Endpoints (detailed)

### Streams (programs)
Base: `/admin/streams`

#### GET /admin/streams
- Query: `page`, `per_page`, `q`, `is_active`
- Response (200):
```json
{
  "success": true,
  "data": {
    "items": [ { /* stream object */ } ],
    "meta": { "page": 1, "per_page": 20, "total": 5 }
  },
  "error": null
}
```

#### POST /admin/streams
- Body:
```json
{ "title": "Web Development", "description": "Full-stack", "duration_weeks": 16, "is_active": 1 }
```
- Validation: `title` required, `duration_weeks` >= 1
- Success (201): returns created stream

#### GET /admin/streams/{id}
#### PUT /admin/streams/{id}
- Body: partial or full stream object fields
- Success (200): updated stream

#### DELETE /admin/streams/{id}
- Success: 204 No Content or 200 with object depending on backend

Stream object
```json
{ "id": 12, "title": "Web Development", "description": "...", "duration_weeks": 16, "is_active": 1, "created_at": "..." }
```

---

### Cohorts
Base: `/admin/cohorts`

#### GET /admin/cohorts
- Query: `stream_id`, `status` (upcoming|active|completed), `page`, `per_page`, `q`

#### POST /admin/cohorts
- Body:
```json
{
  "stream_id": 12,
  "cohort_name": "Cohort 1",
  "start_date": "2025-11-01",
  "end_date": "2026-02-01",
  "status": "upcoming",
  "lead_instructor_id": 5
}
```
- Success (201): returns cohort object

#### GET /admin/cohorts/{id}
#### PUT /admin/cohorts/{id}
#### DELETE /admin/cohorts/{id}

Cohort object
```json
{
  "id": 3,
  "stream_id": 12,
  "cohort_name": "Cohort 1",
  "start_date": "2025-11-01",
  "end_date": "2026-02-01",
  "status": "upcoming",
  "lead_instructor_id": 5
}
```

---

### Sessions (class meetings)
Base: `/admin/sessions`

#### GET /admin/sessions
- Query: `cohort_id`, `stream_id`, `date_from`, `date_to`, `page`

#### POST /admin/sessions
- Body:
```json
{
  "cohort_id": 3,
  "title": "Intro to Node.js",
  "scheduled_at": "2025-11-10T09:00:00+00:00",
  "duration_minutes": 120,
  "location": "Zoom link",
  "type": "lecture",
  "notes": "Bring laptop"
}
```
- Success (201): session created

#### GET /admin/sessions/{id}
#### PUT /admin/sessions/{id}
#### DELETE /admin/sessions/{id}

#### POST /admin/sessions/{id}/attendance
- Use: bulk mark attendance
- Body:
```json
{ "attendance": [ { "student_id": 101, "status": "present" }, { "student_id": 102, "status": "absent" } ] }
```
- Status values: `present`, `absent`, `late`, `excused`
- Success (200): `{ "data": { "updated": 20, "session_id": 123 } }`

#### GET /admin/sessions/{id}/attendance
- Returns attendance list for session

---

### Assignments
Base: `/admin/assignments`

#### GET /admin/assignments
- Query: `cohort_id`, `stream_id`, `page`, `per_page`, `q`, `due_before`, `due_after`

#### POST /admin/assignments
- Body:
```json
{
  "cohort_id": 3,
  "title": "Build a REST API",
  "description": "Create endpoints for X and Y.",
  "due_date": "2025-11-30T23:59:00+00:00",
  "max_score": 100,
  "visibility": "cohort" 
}
```
- `visibility`: `cohort` | `stream` | `public`
- Success (201): created assignment returned

#### GET /admin/assignments/{id}
#### PUT /admin/assignments/{id}
#### DELETE /admin/assignments/{id}

#### GET /admin/assignments/{id}/submissions
- Query: `status` (submitted|graded|late), `page`
- Returns array of submission summaries

---

### Submissions

#### GET /admin/submissions/{id}
- Returns full submission with student info

#### PUT /admin/submissions/{id}/grade
- Body:
```json
{ "grade": 85, "feedback": "Good structure, missing tests.", "graded_by": 1 }
```
- Success (200): updated submission includes `grade`, `graded_at`, `graded_by`

#### POST /admin/submissions/{id}/reopen
- Use: set submission back to `submitted` status for resubmission

Notes: assignment submissions accept `type: "link"` or `type: "text"` (no file uploads in current spec). If file uploads are later added they will be multipart endpoints.

---

### Students / Users (admin management)
Base: `/admin/students`

#### GET /admin/students
- Query: `page`, `per_page`, `q`, `stream_id`, `cohort_id`, `status` (active|inactive|suspended|graduated)
- Returns list of students

#### GET /admin/students/{id}
- Full profile returned including enrollments and attendance rate

#### PUT /admin/students/{id}
- Body: fields to update (e.g., `name`, `phone`, `status`, `profile`)

#### POST /admin/students/{id}/enroll
- Body:
```json
{ "cohort_id": 3, "role": "student", "enrolled_by": 1, "status": "enrolled" }
```
- Success (201): enrollment record

#### POST /admin/students/{id}/unenroll
- Body: `{ "cohort_id": 3, "reason": "No show" }`

#### POST /admin/students/{id}/status
- Body: `{ "status": "suspended", "reason": "Academic misconduct" }`

#### POST /admin/students/bulk-upload
- If present: CSV or JSON bulk create. Confirm with backend whether multipart/form-data is used.

Student (admin view) model
```json
{
  "id": 101,
  "email": "student@example.com",
  "name": "Student Name",
  "phone": "+234801...",
  "status": "active",
  "profile": { "city": "Lagos" },
  "created_at": "2025-09-01T10:00:00+00:00"
}
```

---

### Certificates
Base: `/admin/certificates`

#### GET /admin/certificates
- Query: `student_id`, `cohort_id`, `status` (issued|revoked|pending), `page`

#### POST /admin/certificates/generate
- Body:
```json
{ "student_id": 101, "cohort_id": 3, "issued_by": 1 }
```
- Success (201): returns certificate object
- Error (400): `not_eligible` with message when criteria not met

#### GET /admin/certificates/{id}
#### POST /admin/certificates/{id}/revoke
- Body: `{ "reason": "Academic dishonesty", "revoked_by": 1 }`

Certificate model
```json
{
  "id": 45,
  "certificate_number": "TFB-2025-00045",
  "student_id": 101,
  "cohort_id": 3,
  "issued_at": "2025-12-15T10:00:00+00:00",
  "status": "issued",
  "download_url": "https://api.bootcamp.tokoacademy.org/certificates/45/download"
}
```

---

### Announcements
Base: `/admin/announcements`

#### GET /admin/announcements
- Query: `target` (global|stream|cohort), `stream_id`, `cohort_id`, `page`

#### POST /admin/announcements
- Body:
```json
{
  "title": "Holiday Notice",
  "body": "No sessions on Dec 25th",
  "target": "global",  // global | stream | cohort
  "stream_id": null,
  "cohort_id": null,
  "send_email": true,
  "send_push": false,
  "scheduled_at": null
}
```
- Success (201): returns announcement object and possibly a background job id for fan-out
- Notes: when `target` is `stream` or `cohort`, set corresponding id(s). AnnouncementService will fan-out notifications to relevant students (may be asynchronous).

#### GET /admin/announcements/{id}
#### PUT /admin/announcements/{id}
#### DELETE /admin/announcements/{id}

Announcement model
```json
{
  "id": 99,
  "title": "Holiday Notice",
  "body": "No sessions on Dec 25th",
  "target": "global",
  "stream_id": null,
  "cohort_id": null,
  "send_email": 1,
  "send_push": 0,
  "created_by": 1,
  "created_at": "2025-10-01T08:00:00+00:00"
}
```

---

### Notifications (admin read/monitor)
Base: `/admin/notifications`

#### GET /admin/notifications
- Query: `user_id`, `unread`, `page`
- Returns notifications, used to monitor fan-out and delivery results

---

### Settings
Base: `/admin/settings`

#### GET /admin/settings
- Returns key/value configuration available to admins

#### PUT /admin/settings
- Body: bulk key/value updates (e.g., `{"attendance_threshold_percent": 90}`)
- Success (200): updated settings

Settings example
```json
{ "attendance_threshold_percent": 90, "certificate_number_prefix": "TFB" }
```

---

### Audit Logs
Base: `/admin/audit-logs`

#### GET /admin/audit-logs
- Query: `user_id`, `action`, `date_from`, `date_to`, `page`
- Returns paginated audit records

Audit log model
```json
{
  "id": 1,
  "user_id": 1,
  "action": "assignment_created",
  "target_type": "assignment",
  "target_id": 12,
  "data": { "title": "Build a REST API" },
  "created_at": "2025-10-01T10:00:00+00:00"
}
```

---

## Data models / JSON contracts (compact)
- See each resource above; this section lists core shapes used by the frontend.

### Stream
```json
{ "id": 12, "title": "Web Development", "description": "...", "duration_weeks": 16, "is_active": 1, "created_at": "..." }
```

### Cohort
```json
{ "id": 3, "stream_id": 12, "cohort_name": "Cohort 1", "start_date": "2025-11-01", "end_date": "2026-02-01", "status": "upcoming", "lead_instructor_id": 5 }
```

### Session
```json
{ "id": 123, "cohort_id": 3, "title": "Intro to Node.js", "scheduled_at": "2025-11-10T09:00:00+00:00", "duration_minutes": 120, "location": "Zoom", "type": "lecture", "notes": null }
```

### Assignment
```json
{ "id": 12, "cohort_id": 3, "title": "Build a REST API", "description": "...", "due_date": "2025-11-30T23:59:00+00:00", "max_score": 100, "visibility": "cohort", "created_at": "..." }
```

### Submission
```json
{ "id": 55, "assignment_id": 12, "student_id": 101, "type": "link", "content": "https://github.com/...", "submitted_at": "2025-11-28T12:00:00+00:00", "grade": 85, "feedback": "Well done", "graded_by": 1, "graded_at": "2025-12-01T15:00:00+00:00", "status": "graded" }
```

### Student
```json
{ "id": 101, "email": "student@example.com", "name": "Student Name", "phone": "+234801...", "status": "active", "profile": { "city": "Lagos" }, "created_at": "..." }
```

### Certificate
```json
{ "id": 45, "certificate_number": "TFB-2025-00045", "student_id": 101, "cohort_id": 3, "issued_at": "2025-12-15T10:00:00+00:00", "status": "issued", "download_url": "..." }
```

### Announcement
```json
{ "id": 99, "title": "Holiday Notice", "body": "No sessions on Dec 25th", "target": "global", "stream_id": null, "cohort_id": null, "send_email": 1, "send_push": 0, "created_by": 1, "created_at": "..." }
```

---

## Integration flows & best practices for Admin Frontend

1. Auth flow
- Use `/auth/login` to obtain token. Store securely. Add `Authorization: Bearer <token>` to every admin request.
- On `401 token_expired`, redirect to login.

2. Pagination & Listing
- Use `per_page` larger values (50-100) for admin lists to reduce requests. Always read `meta.total` and calculate pages.

3. Optimistic UI
- On create endpoints, server returns created object (201). Use it to update client state.
- On update endpoints, prefer to replace object with the server-returned object to avoid inconsistencies.

4. Error handling
- Use `error.code` to implement specific UI behavior: `validation_failed` -> field errors, `not_eligible` -> show reason for certificate generation failures.

5. Background jobs & fan-out
- Announcement fan-out may be asynchronous: the API may return a `job_id`. Display job processing status (poll if a `job status` endpoint exists).

6. Rate limiting
- Implement debounce for search and backoff on `429`.

7. Dates & timezone
- Convert ISO 8601 timestamps to user's local timezone for display. Always send dates in ISO 8601.

8. Attachments & submissions
- Current assignment submissions support `link` and `text`. No file uploads in the present spec.

---

## Example cURL snippets (admin)

Login
```bash
curl -X POST "https://api.bootcamp.tokoacademy.org/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tokoacademy.org","password":"AdminPassword123!"}'
```

Create Stream
```bash
curl -X POST "https://api.bootcamp.tokoacademy.org/admin/streams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Web Development","description":"Full-stack","duration_weeks":16,"is_active":1}'
```

Create Cohort
```bash
curl -X POST "https://api.bootcamp.tokoacademy.org/admin/cohorts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"stream_id":12,"cohort_name":"Cohort 1","start_date":"2025-11-01","status":"upcoming","lead_instructor_id":5}'
```

Create Announcement (global)
```bash
curl -X POST "https://api.bootcamp.tokoacademy.org/admin/announcements" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Holiday Notice","body":"No sessions on Dec 25th","target":"global","send_email":true}'
```

Grade a submission
```bash
curl -X PUT "https://api.bootcamp.tokoacademy.org/admin/submissions/55/grade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"grade":85,"feedback":"Good","graded_by":1}'
```

Generate Certificate
```bash
curl -X POST "https://api.bootcamp.tokoacademy.org/admin/certificates/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"student_id":101,"cohort_id":3,"issued_by":1}'
```

---

## Troubleshooting & common issues
- 401 on admin endpoints: token missing, invalid, or expired.
- 403: token lacks admin role or user suspended.
- 400 validation_failed: inspect `error.details` for field-level errors.
- 404: resource not found (confirm IDs used)
- 429: implement retry/backoff and debounce.
- 500: capture request payload and timestamp; provide to backend logs for debugging.

---

## Next recommended deliverables (optional)
- Generate OpenAPI (Swagger) spec for all admin endpoints (recommended). This allows the frontend engineer to generate a typed client.
- Provide a Postman collection or a TypeScript API client wrapper (small helper functions for Login, Streams, Cohorts, Assignments, Submissions, Certificates, Announcements).

---

If you want, I can:
- Add this file to the repo (already done),
- Generate an OpenAPI YAML/JSON file from these endpoints,
- Produce a Postman collection,
- Generate a small TypeScript SDK (axios-based) for admin usage.

Tell me which of the optional deliverables you'd like next and I'll generate it.
