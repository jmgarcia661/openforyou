import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente para servidor (páginas e rotas) com a sessão do utilizador. Respeita RLS. */
export async function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: o middleware já atualiza a sessão.
        }
      },
    },
  });
}
