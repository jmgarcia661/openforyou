import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// RGPD: eliminação da conta. A conta só é eliminada pelo próprio utilizador autenticado.
export async function POST(request: Request) {
  const supabase = await getServerClient();
  const admin = getAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (body.confirm !== "ELIMINAR") {
    return NextResponse.json({ error: "Confirmação em falta." }, { status: 400 });
  }

  // TODO (Fase 3): cancelar a subscrição Stripe antes de eliminar.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("delete user failed", error.message);
    return NextResponse.json({ error: "Não foi possível eliminar." }, { status: 500 });
  }

  if (user.email) {
    await admin.from("newsletter_subscribers").delete().eq("email", user.email.toLowerCase());
  }
  await admin.from("audit_log").insert({ action: "account_deleted", entity: "user", entity_id: user.id });
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
