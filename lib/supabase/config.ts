export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export function assertSupabaseConfigured() {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart the dev server.",
    );
  }
}

// PostgREST answers this when a table doesn't exist yet, i.e. the
// store migration hasn't been applied to the project.
export function isMissingTableError(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}
