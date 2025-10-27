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

  const [cachedAt, setCachedAt] = useState(() => {
    try {
      const t = localStorage.getItem('adminUserCachedAt');
      return t ? Number(t) : null;
    } catch (e) {
      return null;
    }
  });

  // Helper to normalize a raw backend user/profile into the UI-friendly shape
  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    const profile = (rawUser && rawUser.profile) || {};
    return {
      id: rawUser?.id || null,
      email: rawUser?.email || null,
      role: rawUser?.role || null,
      name:
        [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ').trim() || rawUser?.email || null,
      phone: [profile?.phone_country_code, profile?.phone_number].filter(Boolean).join('') || null,
      avatar: profile?.avatar_url || null,
      profile,
      raw: rawUser,
    };
  };

  const login = async (email, password) => {
    try {
      const resp = await api.login(email, password);
      // apiRequest unwraps the JSON but backend returns envelope { success, data, error }
      if (resp && resp.data && resp.data.token) {
        setAuthToken(resp.data.token);
        const rawUser = resp.data.user || null;
        // Normalize user shape to what the UI expects
        const normalized = normalizeUser(rawUser);

        setAdminUser(normalized);
        localStorage.setItem('adminUser', JSON.stringify(normalized));
        const now = Date.now();
        setCachedAt(now);
        localStorage.setItem('adminUserCachedAt', String(now));
        return { success: true, user: normalized };
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
    localStorage.removeItem('adminUserCachedAt');
    removeAuthToken();
  };

  const checkAuth = () => {
    const token = getAuthToken();
    const stored = localStorage.getItem('adminUser');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setAdminUser(parsed);
        const t = localStorage.getItem('adminUserCachedAt');
        setCachedAt(t ? Number(t) : null);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  /**
   * Refresh the current admin user's profile from the backend.
   * Uses a simple cache TTL to avoid spamming the API. If `force` is true,
   * it will always fetch from the server.
   * @param {object} opts { force: boolean, ttlMs: number }
   */
  const refreshProfile = async ({ force = false, ttlMs = 5 * 60 * 1000 } = {}) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const now = Date.now();
    if (!force && cachedAt && now - cachedAt < ttlMs && adminUser) {
      // Cache still fresh
      return { success: true, user: adminUser, cached: true };
    }

    try {
      const resp = await api.getProfile();
      const raw = resp?.data?.user || resp?.data || resp;
      const normalized = normalizeUser(raw);
      setAdminUser(normalized);
      const t = Date.now();
      setCachedAt(t);
      localStorage.setItem('adminUser', JSON.stringify(normalized));
      localStorage.setItem('adminUserCachedAt', String(t));
      return { success: true, user: normalized };
    } catch (err) {
      try {
        const body = await err?.response?.json();
        return { success: false, error: body?.error || err.message };
      } catch (e) {
        return { success: false, error: err.message || 'Failed to refresh profile' };
      }
    }
  };

  /**
   * Update profile on backend and update cached admin user locally.
   */
  const updateProfile = async (data) => {
    try {
      const resp = await api.updateProfile(data);
      const raw = resp?.data?.user || resp?.data || resp;
      const normalized = normalizeUser(raw);
      setAdminUser(normalized);
      const t = Date.now();
      setCachedAt(t);
      localStorage.setItem('adminUser', JSON.stringify(normalized));
      localStorage.setItem('adminUserCachedAt', String(t));
      return { success: true, user: normalized };
    } catch (err) {
      try {
        const body = await err?.response?.json();
        return { success: false, error: body?.error || err.message };
      } catch (e) {
        return { success: false, error: err.message || 'Failed to update profile' };
      }
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, checkAuth, refreshProfile, updateProfile, cachedAt }}>
      {children}
    </AuthContext.Provider>
  );
}
