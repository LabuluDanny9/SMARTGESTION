import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Facultes from './pages/Facultes';
import FaculteDetail from './pages/FaculteDetail';
import Promotions from './pages/Promotions';
import Etudiants from './pages/Etudiants';
import Visiteurs from './pages/Visiteurs';
import Activites from './pages/Activites';
import ActiviteDetail from './pages/ActiviteDetail';
import TypesActivite from './pages/TypesActivite';
import Paiements from './pages/Paiements';
import Exports from './pages/Exports';
import Parametres from './pages/Parametres';
import Analytics from './pages/Analytics';
import InscriptionForm from './pages/InscriptionForm';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Formulaire public QR - sans authentification (workflow QR) */}
          <Route path="/register/:activityId" element={<InscriptionForm />} />
          <Route path="/inscription/:activityId" element={<InscriptionForm />} />
          <Route path="/login" element={<Login />} />
          {/* Admin - protégé */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="facultes" element={<Facultes />} />
            <Route path="facultes/:id" element={<FaculteDetail />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="etudiants" element={<Etudiants />} />
            <Route path="visiteurs" element={<Visiteurs />} />
            <Route path="activites" element={<Activites />} />
            <Route path="activites/:id" element={<ActiviteDetail />} />
            <Route path="types-activite" element={<TypesActivite />} />
            <Route path="paiements" element={<Paiements />} />
            <Route path="exports" element={<Exports />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
