import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await fetchAdminProfileWithRetry(session.user.id);
        if (!profile) await supabase.auth.signOut();
      } else {
        setAdminProfile(null);
      }
      if (mounted) setLoading(false);
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchAdminProfileWithRetry(session.user.id);
          if (!profile) await supabase.auth.signOut();
        } else {
          setAdminProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAdminProfile(userId, signOutIfMissing = true) {
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setAdminProfile(data);
    if (!data && signOutIfMissing) {
      await supabase.auth.signOut();
    }
    return data;
  }

  async function fetchAdminProfileWithRetry(userId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 400));
      const { data } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setAdminProfile(data);
        return data;
      }
    }
    setAdminProfile(null);
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    adminProfile,
    isAdmin: !!adminProfile,
    loading,
    signIn,
    signOut,
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
