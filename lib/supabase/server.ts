import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  assertSupabaseConfigured,
  supabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "./config";

export async function createClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies. proxy.ts refreshes the
          // session on every request, so this is safe to ignore.
        }
      },
    },
  });
}

// getUser() asks Supabase to verify the token, so a revoked or forged
// session is rejected. Cached so a layout and page share one check.
export const getCurrentUser = cache(async () => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});
