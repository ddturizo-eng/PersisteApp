import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The only Supabase client (design §11.3). It uses the secret key, which bypasses RLS,
 * so it must never reach the browser: `server-only` breaks the build if a client file imports it.
 * Without the variables the app keeps working in practice mode (REQ-29 CA4).
 */

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return (client = null);
  // Keep only the origin: a pasted «…supabase.co/rest/v1/» would break every request.
  client = createClient(new URL(url).origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

export function roomsEnabled(): boolean {
  return getSupabase() !== null;
}
