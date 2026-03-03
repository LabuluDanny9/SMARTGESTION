import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCrossAccessFormateur } from './AccessCodeModal';

export default function FormateurProtectedRoute({ children }) {
  const { isFormateur, isAdmin, loading } = useAuth();
  const location = useLocation();
  const hasCrossAccess = getCrossAccessFormateur();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isFormateur || (isAdmin && hasCrossAccess)) {
    return children;
  }
  if (isAdmin) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }
  return <Navigate to="/formateur/login" replace state={{ from: location }} />;
}
