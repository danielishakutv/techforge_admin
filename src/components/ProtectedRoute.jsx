import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { adminUser, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
