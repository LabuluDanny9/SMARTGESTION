import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FormateurProtectedRoute({ children }) {
  const { isFormateur, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!isFormateur) {
    return <Navigate to="/formateur/login" replace state={{ from: location }} />;
  }

  return children;
}
