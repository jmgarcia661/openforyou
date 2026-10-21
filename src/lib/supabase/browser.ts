import { createBrowserClient } from "@supabase/ssr";

/** Cliente para componentes do navegador. Devolve null se o Supabase não estiver configurado. */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
