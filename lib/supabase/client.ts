import { createBrowserClient } from "@supabase/ssr";
import {
  assertSupabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "./config";

// createBrowserClient returns a shared instance, so this is cheap to call.
// The session lives in cookies, which the server reads on each request.
export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
