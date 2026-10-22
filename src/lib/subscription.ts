import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

type WithPeriod = { current_period_end?: number };

/**
 * O fim do período mudou de sítio na API do Stripe (passou do objeto Subscription
 * para cada item). Lê dos itens e, se não existir, do objeto antigo.
 */
export function periodEndIso(sub: Stripe.Subscription): string | null {
  const values: number[] = [];
  for (const item of sub.items?.data ?? []) {
    const end = (item as unknown as WithPeriod).current_period_end;
    if (typeof end === "number") values.push(end);
  }
  const legacy = (sub as unknown as WithPeriod).current_period_end;
  if (values.length === 0 && typeof legacy === "number") values.push(legacy);
  if (values.length === 0) return null;
  return new Date(Math.max(...values) * 1000).toISOString();
}

/** Soma meses sem "saltar" de mês (31 de janeiro + 1 mês = 28 de fevereiro). */
export function addMonths(from: Date, months = 1): Date {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1, from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds()),
  );
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(from.getUTCDate(), lastDay));
  return d;
}

export function formatDatePt(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Lisbon",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export type SubscriptionRow = {
  stripe_customer_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/**
 * Guarda no Supabase o estado da subscrição que está no Stripe.
 * É a única forma de dar ou retirar acesso: nunca o redirecionamento do navegador.
 * Devolve false se a subscrição não pertencer a nenhum utilizador conhecido.
 */
export async function syncSubscription(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
  userIdHint: string | null,
): Promise<boolean> {
  let userId: string | null = sub.metadata?.user_id ?? userIdHint;

  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    console.warn("stripe: subscrição sem utilizador associado", sub.id);
    return false;
  }

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: periodEndIso(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end) || sub.cancel_at != null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    // 23503: o utilizador já foi eliminado. Não há nada a guardar.
    if (error.code === "23503") {
      console.warn("stripe: utilizador já não existe", sub.id);
      return false;
    }
    throw new Error(`upsert subscriptions: ${error.message}`);
  }
  return true;
}
