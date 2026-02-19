import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase non configuré. Ajoutez REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY dans .env');
}

// Désactive le Navigator LockManager qui provoque des timeouts (multi-onglets, navigateurs)
// et bloque l'affichage de la plateforme
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    lock: (_name, _acquireTimeout, fn) => fn(),
  },
});
