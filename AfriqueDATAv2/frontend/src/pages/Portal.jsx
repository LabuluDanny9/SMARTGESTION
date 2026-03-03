import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileCheck, Users } from 'lucide-react';

export default function Portal() {
  const { isAdmin, isFormateur, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (isFormateur) {
      navigate('/formateur', { replace: true });
      return;
    }
  }, [loading, isAdmin, isFormateur, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center mb-12">
        <img src="/logo-salle-numerique.png" alt="Salle du Numérique" className="w-24 h-24 mx-auto mb-6 object-contain" />
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SMART GESTION</h1>
        <p className="text-slate-500 mt-2">Plateforme intelligente – Salle du Numérique UNILU</p>
      </div>

      <div className="relative z-10 w-full max-w-2xl grid md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => navigate('/login?mode=admin')}
          className="group p-8 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center mb-4 transition-colors">
            <FileCheck className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Secrétaire</h2>
          <p className="text-slate-500 text-sm mt-2">Tableau de bord administration, paiements, réservations, exports</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/formateur/login')}
          className="group p-8 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center mb-4 transition-colors">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Chargé de réservation</h2>
          <p className="text-slate-500 text-sm mt-2">Formateur / Enseignant – Mes activités, réservations, calendrier</p>
        </button>
      </div>

      <p className="text-slate-400 text-sm mt-12">Choisissez votre mode de connexion</p>
    </div>
  );
}
