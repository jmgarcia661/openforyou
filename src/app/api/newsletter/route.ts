import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/supabase/public";
import { CONSENT_TEXT, newsletterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { name, email, website } = parsed.data;

  // Campo isco preenchido: finge sucesso e não guarda nada.
  if (website) return NextResponse.json({ ok: true });

  const supabase = getPublicClient();
  if (!supabase) {
    return NextResponse.json({ error: "O serviço não está disponível neste momento." }, { status: 503 });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    name,
    email: email.toLowerCase(),
    status: "pending",
    consent_at: new Date().toISOString(),
    consent_text: CONSENT_TEXT,
    source: "website",
  });

  // 23505 = email já inscrito. Respondemos com sucesso para não revelar quem está na lista.
  if (error && error.code !== "23505") {
    console.error("newsletter insert failed", error.code);
    return NextResponse.json({ error: "Não foi possível guardar o teu pedido. Tenta novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
