import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente com a chave pública (anon). Respeita sempre as regras RLS. */
export function getPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
