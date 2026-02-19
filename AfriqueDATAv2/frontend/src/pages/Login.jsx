import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    async function check() {
      try {
        const { data } = await supabase.rpc('has_any_admin');
        setNeedsFirstAdmin(!data);
      } catch {
        setNeedsFirstAdmin(false);
      }
      setCheckingAdmin(false);
    }
    check();
  }, []);

  if (isAdmin) {
    navigate(from, { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Connexion réussie');
      navigate(from || '/', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Identifiants incorrects. Vérifiez que vous êtes administrateur.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success('Vérifiez votre boîte email pour réinitialiser le mot de passe.');
      setForgotMode(false);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFirstAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nom_complet: nomComplet } },
      });
      if (signUpError) throw signUpError;
      if (!user) throw new Error('Erreur lors de la création du compte');
      await supabase.from('admin_profiles').insert({
        id: user.id,
        email: user.email,
        nom_complet: nomComplet || 'Secrétaire',
      });
      toast.success('Administrateur créé ! Vérifiez votre email puis connectez-vous.');
      setMode('login');
      setPassword('');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-red-50/20 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-b from-primary-50/30 via-transparent to-transparent">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative animate-fade-in">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/80 border border-slate-100 p-8 sm:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/90">
          <div className="text-center mb-8">
            <img
              src="/logo-salle-numerique.png"
              alt="Salle du Numérique"
              className="w-24 h-24 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              SMART GESTION
            </h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-[280px] mx-auto">
              Plateforme intelligente de gestion des activités numériques
            </p>
          </div>

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-sm text-slate-600 text-center">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="admin@unilu.ac.cd"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : needsFirstAdmin && mode === 'create' ? (
            <form onSubmit={handleCreateFirstAdmin} className="space-y-5">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-sm text-primary-800">
                  Créez le premier compte administrateur.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={nomComplet}
                  onChange={(e) => setNomComplet(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  placeholder="Secrétaire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  placeholder="secretaire@unilu.ac.cd"
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-60"
              >
                {loading ? 'Création...' : 'Créer le compte'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 text-slate-500 text-sm hover:text-slate-700"
              >
                Déjà un compte ? Se connecter
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {needsFirstAdmin && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-800">Aucun administrateur enregistré.</p>
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="text-primary-600 font-medium text-sm mt-1 hover:underline"
                  >
                    Créer le premier administrateur →
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="admin@unilu.ac.cd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              {needsFirstAdmin && (
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="w-full py-2 text-slate-500 text-sm hover:text-slate-700"
                >
                  Créer le premier administrateur
                </button>
              )}
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
