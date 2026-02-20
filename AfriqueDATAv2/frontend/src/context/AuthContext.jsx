import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [formateurProfile, setFormateurProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const [adminP, formateurP] = await Promise.all([
          fetchAdminProfile(session.user.id),
          fetchFormateurProfile(session.user.id),
        ]);
        setAdminProfile(adminP ?? null);
        setFormateurProfile(formateurP ?? null);
        if (!adminP && !formateurP) await supabase.auth.signOut();
      } else {
        setAdminProfile(null);
        setFormateurProfile(null);
      }
      if (mounted) setLoading(false);
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const [adminP, formateurP] = await Promise.all([
            fetchAdminProfile(session.user.id),
            fetchFormateurProfile(session.user.id),
          ]);
          setAdminProfile(adminP ?? null);
          setFormateurProfile(formateurP ?? null);
          if (!adminP && !formateurP) await supabase.auth.signOut();
        } else {
          setAdminProfile(null);
          setFormateurProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAdminProfile(userId) {
    const { data } = await supabase.from('admin_profiles').select('*').eq('id', userId).single();
    return data;
  }

  async function fetchFormateurProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('formateur_profiles')
        .select('id, formateur_id, formateurs(id, nom_complet, email, telephone, type, faculty_id)')
        .eq('id', userId)
        .maybeSingle();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  async function fetchAdminProfileWithRetry(userId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 400));
      const data = await fetchAdminProfile(userId);
      if (data) return data;
    }
    return null;
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await new Promise((r) => setTimeout(r, 200));
    const profile = await fetchAdminProfileWithRetry(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Accès refusé. Vous n\'êtes pas administrateur.');
    }
    return data;
  };

  const signInFormateur = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await new Promise((r) => setTimeout(r, 200));
    const profile = await fetchFormateurProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Votre email n\'est pas enregistré comme formateur ou enseignant.');
    }
    setFormateurProfile(profile);
    return data;
  };

  const signUpFormateur = async (email, password) => {
    const { data: formateur } = await supabase
      .from('formateurs')
      .select('id')
      .ilike('email', email)
      .eq('actif', true)
      .maybeSingle();
    if (!formateur) throw new Error('Votre email n\'est pas enregistré comme formateur. Contactez le secrétariat.');

    const { data: authData, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    await supabase.from('formateur_profiles').insert({
      id: authData.user.id,
      formateur_id: formateur.id,
    });
    const profile = await fetchFormateurProfile(authData.user.id);
    setFormateurProfile(profile);
    return authData;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setFormateurProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const [adminP, formateurP] = await Promise.all([
        fetchAdminProfileWithRetry(user.id),
        fetchFormateurProfile(user.id),
      ]);
      setAdminProfile(adminP ?? null);
      setFormateurProfile(formateurP ?? null);
    }
  };

  const value = {
    user,
    adminProfile,
    formateurProfile,
    isAdmin: !!adminProfile,
    isFormateur: !!formateurProfile,
    loading,
    signIn,
    signInFormateur,
    signUpFormateur,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
