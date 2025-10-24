// API utility functions for connecting to backend

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://bootcamp.tokoacademy.org/api';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
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
  login: (email, password) => 
    apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Streams
  getStreams: () => apiRequest('/admin/streams'),
  createStream: (data) => apiRequest('/admin/streams', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Cohorts
  getCohorts: () => apiRequest('/admin/cohorts'),
  createCohort: (data) => apiRequest('/admin/cohorts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCohort: (id) => apiRequest(`/admin/cohorts/${id}`),
  updateCohort: (id, data) => apiRequest(`/admin/cohorts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Sessions
  getSessions: () => apiRequest('/admin/sessions'),
  createSession: (data) => apiRequest('/admin/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSession: (id) => apiRequest(`/admin/sessions/${id}`),
  markAttendance: (data) => apiRequest('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Assignments
  getAssignments: () => apiRequest('/admin/assignments'),
  createAssignment: (data) => apiRequest('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAssignment: (id) => apiRequest(`/admin/assignments/${id}`),
  gradeSubmission: (submissionId, data) => apiRequest(`/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Students
  getStudents: () => apiRequest('/admin/students'),
  getStudent: (id) => apiRequest(`/admin/students/${id}`),
  updateStudent: (id, data) => apiRequest(`/admin/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Certificates
  getCertificates: () => apiRequest('/admin/certificates'),
  issueCertificate: (data) => apiRequest('/admin/certificates/issue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  revokeCertificate: (id) => apiRequest(`/admin/certificates/${id}`, {
    method: 'DELETE',
  }),

  // Announcements
  broadcastAnnouncement: (data) => apiRequest('/admin/announcements/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRecentAnnouncements: () => apiRequest('/admin/announcements/recent'),
};

export default api;
