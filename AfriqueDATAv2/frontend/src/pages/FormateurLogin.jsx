import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function FormateurLogin() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInFormateur, signUpFormateur, isFormateur, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isFormateur) {
    navigate('/formateur', { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInFormateur(email, password);
      toast.success('Connexion réussie');
      navigate('/formateur', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await signUpFormateur(email, password);
      toast.success('Compte activé ! Vérifiez votre email si nécessaire.');
      navigate('/formateur', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'activation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50/30 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-3xl font-bold text-white">F</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Espace Formateur
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Formateurs & enseignants – Salle du Numérique
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="votre@email.unilu.cd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-700 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setPassword(''); }}
                className="w-full py-2 text-slate-500 text-sm hover:text-indigo-600 transition-colors"
              >
                Première visite ? Activer mon compte
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-sm text-indigo-800">
                  Votre email doit être enregistré comme formateur. Contactez le secrétariat si besoin.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email (formateur)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="votre@email.unilu.cd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe (min. 6 caractères)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-700 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'Activation...' : 'Activer mon compte'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 text-slate-500 text-sm hover:text-indigo-600 transition-colors"
              >
                Déjà un compte ? Se connecter
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          Salle du Numérique – UNILU
        </p>
      </div>
    </div>
  );
}
