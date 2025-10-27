import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { getAuthToken } from '../utils/api';

export default function ProtectedRoute({ children }) {
  const { adminUser, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!adminUser) {
    const token = getAuthToken();
    // If a token exists, allow a moment for checkAuth to hydrate state
    if (token) {
      return null;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
