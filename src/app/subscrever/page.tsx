import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatEUR, getPrices } from "@/lib/pricing";
import { addMonths, formatDatePt } from "@/lib/subscription";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Começar o primeiro mês" };
export const dynamic = "force-dynamic";

export default async function SubscreverPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    return (
      <div className="wrap py-20">
        <h1 className="text-4xl">Acesso completo</h1>
        <p className="mt-4 text-ink-soft">Os pagamentos ainda não estão disponíveis.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/subscrever");

  const { data: active } = await supabase.rpc("has_active_subscription");
  if (active) redirect("/conta");

  const prices = await getPrices();
  const monthly = formatEUR(prices.monthlyCents);
  const next = formatDatePt(addMonths(new Date()));

  return (
    <div className="wrap py-14 md:py-20">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl md:text-5xl">Começar o primeiro mês</h1>
        <p className="mt-3 text-ink-soft">Confirma o que vais pagar, antes de passares ao pagamento seguro.</p>

        <dl className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
          <div className="flex items-baseline justify-between gap-6 py-4">
            <dt>Hoje</dt>
            <dd className="font-display text-3xl">{formatEUR(prices.firstMonthCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-4">
            <dt>Próxima renovação, a {next}</dt>
            <dd className="font-display text-3xl">{monthly}</dd>
          </div>
          <div className="py-4 text-ink-soft">
            Depois, {monthly}/mês até cancelares. Cancelas quando quiseres e manténs o acesso até ao fim do período
            já pago.
          </div>
        </dl>

        <div className="mt-8">
          <CheckoutButton />
        </div>
      </div>
    </div>
  );
}
