// ============================================
// Supabase Admin Client
// ============================================
// Cliente con service role key para operaciones server-side
// que necesitan bypass de RLS (cron jobs, batch operations)

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Crea un cliente de Supabase con service role key.
 * Este cliente bypassa RLS y debe usarse solo en contextos server-side seguros.
 *
 * Casos de uso:
 * - Cron jobs (generación de resúmenes)
 * - Batch operations
 * - Operaciones que necesitan acceso a datos de múltiples usuarios
 */
export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variables"
    );
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

/**
 * Verifica si el admin client está disponible
 */
export function isAdminConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
