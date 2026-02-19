import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const isValidUrl = (s) => typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));

let supabase;
try {
  if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { lock: (_name, _acquireTimeout, fn) => fn() },
    });
  } else {
    throw new Error('Config manquante');
  }
} catch (e) {
  const err = new Error(
    'Supabase non configuré. Ajoutez REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY dans Vercel → Settings → Environment Variables.'
  );
  supabase = new Proxy(
    {},
    {
      get() {
        throw err;
      },
    }
  );
}

export { supabase };
