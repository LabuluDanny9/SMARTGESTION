import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCrossAccessAdmin } from './AccessCodeModal';

export default function ProtectedRoute({ children }) {
  const { isAdmin, isFormateur, loading } = useAuth();
  const location = useLocation();
  const hasCrossAccess = getCrossAccessAdmin();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin && !(isFormateur && hasCrossAccess)) {
    return <Navigate to="/login?mode=admin" state={{ from: location }} replace />;
  }

  return children;
}
