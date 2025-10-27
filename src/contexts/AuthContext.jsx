import { createContext, useContext, useState } from 'react';
import api, { setAuthToken, removeAuthToken, getAuthToken } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const resp = await api.login(email, password);
      // apiRequest unwraps the JSON but backend returns envelope { success, data, error }
      if (resp && resp.data && resp.data.token) {
        setAuthToken(resp.data.token);
        const user = resp.data.user || null;
        setAdminUser(user);
        localStorage.setItem('adminUser', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: resp?.error || 'Invalid response from auth' };
    } catch (err) {
      // apiRequest throws on non-ok; attempt to parse envelope
      try {
        const body = await err?.response?.json();
        return { success: false, error: body?.error || err.message };
      } catch (e) {
        return { success: false, error: err.message || 'Login failed' };
      }
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    removeAuthToken();
  };

  const checkAuth = () => {
    const token = getAuthToken();
    const stored = localStorage.getItem('adminUser');
    if (token && stored) {
      try {
        setAdminUser(JSON.parse(stored));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
