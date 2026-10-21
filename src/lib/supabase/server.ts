import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

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
      setAll(list: CookieToSet[]) {
        try {
          list.forEach(({ name, value, options }: CookieToSet) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: o middleware já atualiza a sessão.
        }
      },
    },
  });
}
