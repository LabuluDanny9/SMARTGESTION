/**
 * Texte exploitable pour détecter les échecs réseau (navigateurs / Supabase varient).
 */
function collectErrorText(err, depth = 0) {
  if (!err || depth > 4) return '';
  const chunks = [];
  if (typeof err === 'string') chunks.push(err);
  else {
    chunks.push(String(err.message || ''));
    if (err.name) chunks.push(String(err.name));
    if (err.cause) chunks.push(collectErrorText(err.cause, depth + 1));
  }
  return chunks.filter(Boolean).join(' ');
}

/**
 * Messages lisibles quand le navigateur ne peut pas joindre Supabase (réseau, .env, pare-feu).
 */
export function getSupabaseUserMessage(err) {
  if (!err) return 'Erreur inconnue';
  const name = err.name || '';
  const msg = collectErrorText(err);
  const compact = msg.toLowerCase();

  const isFetchFailure =
    compact.includes('failed to fetch') ||
    compact.includes('load failed') ||
    compact.includes('networkerror') ||
    compact.includes('network request failed') ||
    name === 'AuthRetryableFetchError' ||
    (name === 'TypeError' && /fetch|network|load failed/i.test(msg));

  if (isFetchFailure) {
    return (
      'Connexion au serveur impossible. Vérifiez dans AfriqueDATAv2/frontend/.env les variables ' +
      'REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY (projet Supabase → Settings → API), ' +
      'puis redémarrez npm start. Vérifiez aussi votre réseau et pare-feu (domaines *.supabase.co).'
    );
  }

  return String(err.message || err) || 'Erreur inconnue';
}
