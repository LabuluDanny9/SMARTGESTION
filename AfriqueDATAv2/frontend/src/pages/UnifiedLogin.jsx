import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getSupabaseUserMessage } from '../lib/supabaseErrors';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';

const MODES = { admin: 'Secrétaire', formateur: 'Chargé de réservation' };

export default function UnifiedLogin() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'admin';
  const [mode, setMode] = useState(modeParam === 'formateur' ? 'formateur' : 'admin');
  const [subMode, setSubMode] = useState('login'); // login | create | signup
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const { signIn, signInFormateur, signUpFormateur, isAdmin, isFormateur } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMode(modeParam === 'formateur' ? 'formateur' : 'admin');
  }, [modeParam]);

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

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
    else if (isFormateur) navigate('/formateur', { replace: true });
  }, [isAdmin, isFormateur, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'formateur') {
        await signInFormateur(email, password);
        toast.success('Connexion réussie');
        setTimeout(() => navigate('/formateur', { replace: true }), 150);
      } else {
        await signIn(email, password);
        toast.success('Connexion réussie');
        setTimeout(() => navigate('/admin', { replace: true }), 150);
      }
    } catch (err) {
      toast.error(getSupabaseUserMessage(err) || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const [formateurCodeModal, setFormateurCodeModal] = useState(null);

  const handleSignUpFormateur = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const result = await signUpFormateur(email, password);
      const code = result?.profile?.code_acces_admin;
      setFormateurCodeModal(code);
      toast.success('Compte activé !');
    } catch (err) {
      toast.error(getSupabaseUserMessage(err) || 'Erreur lors de l\'activation.');
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
      toast.success('Vérifiez votre boîte email.');
      setForgotMode(false);
    } catch (err) {
      toast.error(getSupabaseUserMessage(err) || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const [adminCodeModal, setAdminCodeModal] = useState(null);

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
      if (!user) throw new Error('Erreur lors de la création');
      await supabase.from('admin_profiles').insert({
        id: user.id,
        email: user.email,
        nom_complet: nomComplet || 'Secrétaire',
      });
      const { data: profile } = await supabase.from('admin_profiles').select('code_acces_formateur').eq('id', user.id).single();
      setAdminCodeModal(profile?.code_acces_formateur);
      toast.success('Administrateur créé ! Vérifiez votre email.');
      setSubMode('login');
      setPassword('');
    } catch (err) {
      toast.error(getSupabaseUserMessage(err) || 'Erreur');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-primary-50/20 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${mode === 'admin' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Secrétaire
          </button>
          <button
            type="button"
            onClick={() => setMode('formateur')}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${mode === 'formateur' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Chargé réservation
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="text-center mb-6">
            <img src="/logo-salle-numerique.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
            <h1 className="text-xl font-bold text-slate-800">Connexion {MODES[mode]}</h1>
          </div>

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-slate-600 text-center">Entrez votre email pour réinitialiser le mot de passe.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email" />
              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-60">
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full py-2 text-slate-500 text-sm">← Retour</button>
            </form>
          ) : needsFirstAdmin && mode === 'admin' && subMode === 'create' ? (
            <form onSubmit={handleCreateFirstAdmin} className="space-y-4">
              <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-800">Créez le premier compte administrateur.</div>
              <input type="text" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} required className="input-field" placeholder="Nom complet" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="Mot de passe (min. 6)" />
              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium">Créer</button>
              <button type="button" onClick={() => setSubMode('login')} className="w-full py-2 text-slate-500 text-sm">Déjà un compte ?</button>
            </form>
          ) : mode === 'formateur' && subMode === 'signup' ? (
            <form onSubmit={handleSignUpFormateur} className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-800">Votre email doit être enregistré comme formateur.</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="Mot de passe (min. 6)" />
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium">Activer mon compte</button>
              <button type="button" onClick={() => setSubMode('login')} className="w-full py-2 text-slate-500 text-sm">Déjà un compte ?</button>
            </form>
          ) : mode === 'formateur' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-800">
                Email doit être enregistré comme formateur. Première visite ? Activez votre compte.
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Mot de passe" />
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <button type="button" onClick={() => { setSubMode('signup'); setPassword(''); }} className="w-full py-2 text-slate-500 text-sm">Première visite ? Activer mon compte</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {needsFirstAdmin && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                  Aucun administrateur. <button type="button" onClick={() => setSubMode('create')} className="font-medium underline">Créer le premier</button>
                </div>
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Mot de passe" />
              <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-primary-600 float-right">Mot de passe oublié ?</button>
              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-60">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}

          <button type="button" onClick={() => navigate('/')} className="w-full py-2 mt-4 text-slate-400 text-sm hover:text-slate-600">
            ← Retour au portail
          </button>
        </div>
      </div>

      {/* Modal Code formateur */}
      {formateurCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={24} className="text-indigo-600" />
              <h3 className="font-bold text-slate-800">Votre code d&apos;accès</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Conservez ce code. Il vous permet d&apos;accéder au dashboard Secrétaire depuis votre espace formateur.
            </p>
            <div className="text-center p-4 bg-indigo-50 rounded-xl mb-4">
              <p className="text-2xl font-bold text-indigo-700" style={{ letterSpacing: 6 }}>{formateurCodeModal}</p>
            </div>
            <button
              type="button"
              onClick={() => { setFormateurCodeModal(null); navigate('/formateur', { replace: true }); }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              J&apos;ai noté le code
            </button>
          </div>
        </div>
      )}

      {/* Modal Code premier admin */}
      {adminCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={24} className="text-primary-600" />
              <h3 className="font-bold text-slate-800">Votre code d&apos;accès</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Conservez ce code. Il vous permet d&apos;accéder au dashboard Formateur depuis votre espace secrétaire.
            </p>
            <div className="text-center p-4 bg-primary-50 rounded-xl mb-4">
              <p className="text-2xl font-bold text-primary-700" style={{ letterSpacing: 6 }}>{adminCodeModal}</p>
            </div>
            <button
              type="button"
              onClick={() => setAdminCodeModal(null)}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
            >
              J&apos;ai noté le code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
