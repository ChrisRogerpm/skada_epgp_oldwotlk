import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase con la service role key. Solo debe llamarse desde código
 * server-only (rutas API / repositorios que ellas usan), nunca desde
 * componentes cliente. Se inicializa de forma perezosa (no al importar el
 * módulo) para que la ausencia de la env var no rompa `next build`, que
 * evalúa los módulos de las rutas al recolectar su metadata.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL no configurados.',
    );
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return client;
}
