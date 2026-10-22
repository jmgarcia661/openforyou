import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ButtonLink } from "@/components/ButtonLink";
import { formatDatePt } from "@/lib/subscription";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bem-vindo" };
export const dynamic = "force-dynamic";

export default async function BemVindoPage() {
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/bem-vindo");

  const { data: active } = await supabase.rpc("has_active_subscription");

  if (!active) {
    return (
      <div className="wrap py-20 text-center">
        <AutoRefresh />
        <h1 className="text-4xl md:text-5xl">A confirmar o teu pagamento</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          Demora só alguns segundos. Esta página atualiza sozinha.
        </p>
      </div>
    );
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="wrap max-w-2xl py-16 md:py-24">
      <h1 className="text-5xl md:text-6xl">Bem-vindo ao Open For You.</h1>
      <p className="mt-5 text-lg text-ink-soft">
        O teu acesso completo já está ativo. Enviámos a confirmação por email.
        {sub?.current_period_end && <> A tua próxima renovação é a {formatDatePt(sub.current_period_end)}.</>}
      </p>

      <ul className="mt-10 divide-y divide-ink/15 border-y border-ink/15">
        <li className="flex items-center justify-between gap-6 py-4">
          <span>Começa por uma prática desta semana</span>
          <ButtonLink href="/esta-semana" variant="quiet">
            Ver esta semana
          </ButtonLink>
        </li>
        <li className="flex items-center justify-between gap-6 py-4">
          <span>Completa o teu perfil e o teu fuso horário</span>
          <ButtonLink href="/conta" variant="quiet">
            Abrir a conta
          </ButtonLink>
        </li>
        <li className="flex items-center justify-between gap-6 py-4">
          <span>Conhece as regras da comunidade</span>
          <ButtonLink href="/regras-da-comunidade" variant="quiet">
            Ler as regras
          </ButtonLink>
        </li>
      </ul>
    </div>
  );
}
