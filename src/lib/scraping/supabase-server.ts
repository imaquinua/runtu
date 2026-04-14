/**
 * Cliente Supabase para uso en Vercel Functions (service role).
 * Solo se usa desde api/**, nunca desde el cliente.
 */
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en env vars");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
