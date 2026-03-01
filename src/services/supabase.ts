import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Re-validate session when user returns to the app/tab
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

// Refresh session when the tab regains visibility (e.g., after reading for a long time)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession();
    }
  });
}
