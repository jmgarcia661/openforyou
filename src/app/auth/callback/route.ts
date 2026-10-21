import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

// Recebe o link dos emails (confirmar conta, recuperar palavra-passe) e cria a sessão.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await getServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
