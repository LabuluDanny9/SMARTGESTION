import { supabase } from './supabase';

const getFunctionsUrl = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  if (!url) return null;
  return `${url.replace(/\/$/, '')}/functions/v1`;
};

export async function createSecretary(email, password, nom_complet) {
  const functionsUrl = getFunctionsUrl();
  if (!functionsUrl) throw new Error('Configuration Supabase manquante');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Non connecté');

  const res = await fetch(`${functionsUrl}/create-secretary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, password, nom_complet }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Erreur lors de la création');
  return json;
}
