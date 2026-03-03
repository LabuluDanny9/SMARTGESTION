import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Crée le compte d'accès pour un formateur/enseignant (auth + formateur_profiles).
 * L'admin enregistre le formateur avec email et mot de passe.
 * Génère le lien de connexion pour le formateur.
 */
export async function createFormateurAccess(formateurId, email, password) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configuration Supabase manquante');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non connecté. Vous devez être administrateur.');

  const emailTrim = email?.trim();
  if (!emailTrim) throw new Error('Email requis.');
  if (!password || password.length < 6) throw new Error('Mot de passe : minimum 6 caractères.');

  const tempClient = createClient(url, key, {
    auth: {
      storageKey: 'smart-gestion-temp-formateur',
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
    email: emailTrim,
    password,
    options: { emailRedirectTo: undefined },
  });

  if (signUpError) {
    if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
      throw new Error('Cet email a déjà un compte. Utilisez la réinitialisation de mot de passe si besoin.');
    }
    throw new Error(signUpError.message || 'Erreur à la création du compte');
  }

  if (!signUpData?.user?.id) throw new Error('Impossible de créer l\'utilisateur');

  // Délai pour laisser auth.users se synchroniser (évite la violation FK)
  await new Promise((r) => setTimeout(r, 800));

  let insertError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await supabase.from('formateur_profiles').insert({
      id: signUpData.user.id,
      formateur_id: formateurId,
    });
    insertError = result.error;
    if (!insertError) break;
    if (insertError.code === '23503' && insertError.message?.includes('foreign key')) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    break;
  }

  if (insertError) {
    if (insertError.code === '23505') throw new Error('Ce formateur a déjà un accès activé.');
    if (insertError.code === '23503') throw new Error('Erreur de synchronisation. Réessayez dans quelques secondes.');
    throw new Error(insertError.message || 'Erreur à l\'activation');
  }

  const loginUrl = `${window.location.origin}/formateur/login?email=${encodeURIComponent(emailTrim)}`;
  return { success: true, loginUrl, userId: signUpData.user.id };
}
