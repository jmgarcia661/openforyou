import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key. Ignora RLS: usar apenas no servidor e
 * apenas para operações já autorizadas (ex.: gerar links temporários de
 * conteúdos que o servidor sabe serem gratuitos ou de membros ativos).
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
