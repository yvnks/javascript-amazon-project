import { createClient } from "@supabase/supabase-js";

const supabaseUrl = __SUPABASE_URL__?.trim();
const supabasePublishableKey = __SUPABASE_PUBLISHABLE_KEY__?.trim();

export const supabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart Vite.",
    );
  }

  return supabase;
}
