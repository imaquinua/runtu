import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Extrae el Bearer token del header Authorization y devuelve el user_id + business_id.
 * Usar en endpoints /api/scraping/**.
 */
export async function authenticateRequest(
  req: Request
): Promise<{ userId: string; businessId: string; admin: SupabaseClient } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "No autenticado", status: 401 };

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { error: "Supabase no configurado", status: 500 };
  }

  // Valida el token
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return { error: "Token inválido", status: 401 };

  // Busca business del usuario con admin client
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: biz } = await admin
    .from("businesses")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!biz) return { error: "No tienes un negocio configurado", status: 403 };

  return { userId: userData.user.id, businessId: biz.id, admin };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
