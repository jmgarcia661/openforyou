import { notFound, redirect } from "next/navigation";
import { getServerClient } from "./supabase/server";

/** Garante que quem abre a página é administrador. Todas as páginas /admin usam isto. */
export async function requireAdmin() {
  const supabase = await getServerClient();
  if (!supabase) return notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/entrar?next=/admin");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return notFound();

  return { supabase, user };
}
