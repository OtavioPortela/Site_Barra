import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from './Loading';

interface ProtectedRoutePatraoProps {
  children: React.ReactNode;
}

export const ProtectedRoutePatrao = ({ children }: ProtectedRoutePatraoProps) => {
  const { isAuthenticated, isPatrao, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isPatrao()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

