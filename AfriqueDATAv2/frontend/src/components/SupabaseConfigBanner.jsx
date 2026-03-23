import { useEffect, useMemo, useState } from 'react';
import { getSupabaseConfigHint } from '../lib/supabase';

/**
 * Alerte si .env est incomplet / d’exemple, ou si le navigateur n’atteint pas Supabase (même cause que « Failed to fetch »).
 */
export default function SupabaseConfigBanner() {
  const hint = useMemo(() => getSupabaseConfigHint(), []);
  const [reachable, setReachable] = useState(null);

  useEffect(() => {
    if (!hint.ready) return undefined;
    const base = (process.env.REACT_APP_SUPABASE_URL || '').trim().replace(/\/$/, '');
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 12000);
    fetch(`${base}/auth/v1/health`, { method: 'GET', signal: ac.signal })
      .then(() => setReachable(true))
      .catch(() => setReachable(false))
      .finally(() => clearTimeout(tid));
    return () => {
      ac.abort();
      clearTimeout(tid);
    };
  }, [hint.ready]);

  if (!hint.ready) {
    return (
      <div
        className="sticky top-0 z-[200] border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900 shadow-sm"
        role="alert"
      >
        {hint.missing ? (
          <>
            <strong>Supabase non configuré.</strong> Créez{' '}
            <code className="rounded bg-red-100 px-1">AfriqueDATAv2/frontend/.env</code> avec{' '}
            <code className="rounded bg-red-100 px-1">REACT_APP_SUPABASE_URL</code> et{' '}
            <code className="rounded bg-red-100 px-1">REACT_APP_SUPABASE_ANON_KEY</code> (dashboard Supabase →
            Settings → API), puis redémarrez <code className="rounded bg-red-100 px-1">npm start</code>.
          </>
        ) : (
          <>
            <strong>Fichier .env encore sur les valeurs d’exemple.</strong> Remplacez l’URL et la clé <em>anon</em>{' '}
            par celles de votre projet Supabase, puis redémarrez <code className="rounded bg-red-100 px-1">npm start</code>.
          </>
        )}
      </div>
    );
  }

  if (reachable === false) {
    return (
      <div
        className="sticky top-0 z-[200] border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950 shadow-sm"
        role="alert"
      >
        <strong>Connexion à Supabase impossible</strong> ({hint.host || hint.urlPreview}). Réseau, pare-feu ou VPN
        bloquent souvent l’accès. Vérifiez aussi que l’URL du projet est exacte. En local, testez l’URL dans le
        navigateur ou les outils Réseau (F12) lors d’une tentative de connexion.
      </div>
    );
  }

  return null;
}
