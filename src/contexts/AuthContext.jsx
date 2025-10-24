import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);

  const login = (email, password) => {
    if (email === 'daniel.okon@tokoacademy.org' && password === 'admin123') {
      const user = {
        id: 99,
        name: 'Daniel Okon',
        role: 'Program Director',
        email: 'daniel.okon@tokoacademy.org',
        phone: '+2348012345678',
        assignedStreams: ['Web Development', 'AI Essentials'],
        lastLogin: new Date().toISOString(),
        location: 'Abuja, Nigeria',
        isAdmin: true,
      };
      setAdminUser(user);
      localStorage.setItem('adminUser', JSON.stringify(user));
      return { success: true };
    } else if (email === 'instructor@tokoacademy.org' && password === 'instructor123') {
      const user = {
        id: 100,
        name: 'Chioma Nwosu',
        role: 'Instructor',
        email: 'instructor@tokoacademy.org',
        phone: '+2348023456789',
        assignedStreams: ['Data Analysis & Visualization'],
        lastLogin: new Date().toISOString(),
        location: 'Lagos, Nigeria',
        isAdmin: false,
      };
      setAdminUser(user);
      localStorage.setItem('adminUser', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  const checkAuth = () => {
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
