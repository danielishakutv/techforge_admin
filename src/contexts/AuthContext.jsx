import { createContext, useContext, useState } from 'react';
import api, { setAuthToken, getAuthToken, removeAuthToken } from '../utils/api';

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
      const res = await api.login(email, password);
      if (res && res.success && res.data) {
        const { token, user } = res.data;
        if (token) {
          setAuthToken(token);
        }
        setAdminUser(user);
        localStorage.setItem('adminUser', JSON.stringify(user));
        return { success: true };
      }
      return { success: false, error: res?.error?.message || 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    removeAuthToken();
  };

  const checkAuth = () => {
    const token = getAuthToken();
    if (!token) return false;
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      setAdminUser(JSON.parse(stored));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
