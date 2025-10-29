// API utility functions for connecting to backend

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.bootcamp.tokoacademy.org/';

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Set authentication token in localStorage
 */
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/admin/cohorts')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Build URL safely to avoid double-slashes
  const base = String(API_BASE_URL).replace(/\/+$/, '');
  const path = String(endpoint).startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  const response = await fetch(url, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/admin/login';
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

/**
 * API helper methods
 */
export const api = {
  // Authentication
  // NOTE: backend auth endpoint is /auth/login (returns { data: { token, expires_in, user } })
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Streams
  getStreams: () => apiRequest('/admin/streams'),
  createStream: (data) => apiRequest('/admin/streams', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStream: (id, data) => apiRequest(`/admin/streams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStream: (id) => apiRequest(`/admin/streams/${id}`, { method: 'DELETE' }),

  // Cohorts
  getCohorts: () => apiRequest('/admin/cohorts'),
  createCohort: (data) => apiRequest('/admin/cohorts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCohort: (id) => apiRequest(`/admin/cohorts/${id}`),
  updateCohort: (id, data) => apiRequest(`/admin/cohorts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCohort: (id) => apiRequest(`/admin/cohorts/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/sessions${qs ? `?${qs}` : ''}`);
  },
  createSession: (data) => {
    const { cohort_id, ...rest } = data || {};
    // Backend requires cohort_id as a query parameter
    const qs = cohort_id ? `?cohort_id=${encodeURIComponent(cohort_id)}` : '';
    return apiRequest(`/admin/sessions${qs}`, {
      method: 'POST',
      body: JSON.stringify({ ...rest, cohort_id }),
    });
  },
  getSession: (id) => apiRequest(`/admin/sessions/${id}`),
  updateSession: (id, data) => apiRequest(`/admin/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSession: (id) => apiRequest(`/admin/sessions/${id}`, { method: 'DELETE' }),

  // Attendance (Full CRUD)
  getStudentsForCohort: (cohortId) => apiRequest(`/admin/attendance/students?cohort_id=${cohortId}`),
  getSessionAttendance: (sessionId) => apiRequest(`/admin/attendance/session/${sessionId}`),
  getCohortAttendance: (cohortId) => apiRequest('/admin/attendance/cohort', {
    method: 'POST',
    body: JSON.stringify({ cohort_id: cohortId }),
  }),
  markAttendance: (data) => apiRequest('/admin/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSingleAttendance: (sessionId, userId, status) => apiRequest(`/admin/attendance/session/${sessionId}/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  deleteSingleAttendance: (sessionId, userId) => apiRequest(`/admin/attendance/session/${sessionId}/user/${userId}`, { method: 'DELETE' }),
  deleteSessionAttendance: (sessionId) => apiRequest(`/admin/attendance/session/${sessionId}/all`, { method: 'DELETE' }),

  // Assignments
  getAssignments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/assignments${qs ? `?${qs}` : ''}`);
  },
  createAssignment: (data) => apiRequest('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAssignment: (id) => apiRequest(`/admin/assignments/${id}`),
  updateAssignment: (id, data) => apiRequest(`/admin/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => apiRequest(`/admin/assignments/${id}`, { method: 'DELETE' }),
  
  // Grading
  getAssignmentStudents: (assignmentId) => apiRequest(`/admin/assignments/${assignmentId}/students`),
  gradeBulk: (assignmentId, data) => apiRequest(`/admin/assignments/${assignmentId}/grade-bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  gradeSubmission: (submissionId, data) => apiRequest(`/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Students
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/students${qs ? `?${qs}` : ''}${qs ? '&' : '?'}include_details=true`);
  },
  createStudent: (data) => apiRequest('/admin/students', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStudent: (id) => apiRequest(`/admin/students/${id}`),
  updateStudent: (id, data) => apiRequest(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStudent: (id) => apiRequest(`/admin/students/${id}`, { method: 'DELETE' }),

  // Users (Instructors)
  getInstructors: () => apiRequest('/admin/users?role=instructor'),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  updateUser: (id, data) => apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),

  // Current user / profile
  // NOTE: backend may expose a 'me' endpoint. Adjust path if your API differs.
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Certificates
  getCertificates: () => apiRequest('/admin/certificates'),
  issueCertificate: (data) => apiRequest('/admin/certificates/issue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  revokeCertificate: (certificate_id) => apiRequest('/admin/certificates/revoke', {
    method: 'POST',
    body: JSON.stringify({ certificate_id }),
  }),
  deleteCertificate: (id) => apiRequest(`/admin/certificates/${id}`, { method: 'DELETE' }),

  // Announcements
  broadcastAnnouncement: (data) => apiRequest('/admin/announcements/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRecentAnnouncements: () => apiRequest('/admin/announcements/recent'),
  updateAnnouncement: (id, data) => apiRequest(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => apiRequest(`/admin/announcements/${id}`, { method: 'DELETE' }),
};

export default api;
