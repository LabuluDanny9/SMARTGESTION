import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Crée un secrétaire (admin) - sans Edge Function.
 * Utilise signUp sur un client temporaire (n'affecte pas la session admin)
 * puis insert dans admin_profiles avec la session admin.
 */
export async function createSecretary(email, password, nom_complet) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configuration Supabase manquante');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non connecté. Vous devez être administrateur.');

  // Client temporaire isolé (ne modifie pas la session de l'admin)
  const tempClient = createClient(url, key, {
    auth: {
      storageKey: 'smart-gestion-temp-signup',
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { nom_complet: nom_complet.trim() },
      emailRedirectTo: undefined,
    },
  });

  if (signUpError) {
    if (signUpError.message?.includes('already registered')) {
      throw new Error('Cet email est déjà utilisé.');
    }
    throw new Error(signUpError.message || 'Erreur à la création du compte');
  }

  if (!signUpData?.user?.id) {
    throw new Error('Impossible de créer l\'utilisateur');
  }

  const { error: insertError } = await supabase.from('admin_profiles').insert({
    id: signUpData.user.id,
    email: email.trim(),
    nom_complet: nom_complet.trim(),
  });

  if (insertError) {
    // Si l'insert échoue, l'utilisateur existe dans auth mais pas en admin
    // On ne peut pas le supprimer facilement - on informe l'utilisateur
    if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
      throw new Error('Ce secrétaire existe déjà.');
    }
    throw new Error(insertError.message || 'Erreur à l\'ajout du profil admin');
  }

  return { success: true, id: signUpData.user.id };
}
