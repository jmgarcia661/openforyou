import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { SITE } from "./site";
import { getPublicClient } from "./supabase/public";

export type BookSettings = {
  cover_path: string | null;
  excerpt_path: string | null;
  kindle_url: string | null;
  bonus_content_id: string | null;
};

const asText = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

export function parseBookSettings(value: unknown): BookSettings {
  const o = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    cover_path: asText(o.cover_path),
    excerpt_path: asText(o.excerpt_path),
    kindle_url: asText(o.kindle_url),
    bonus_content_id: asText(o.bonus_content_id),
  };
}

/** "14", "14,5" ou "14.99" em cêntimos. Aceita entre 1 € e 500 €. */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents >= 100 && cents <= 50_000 ? cents : null;
}

export function centsToInput(cents: number): string {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

type OrderLike = { status: string; expires_at: string; downloads: number; download_limit: number };

export function remainingDownloads(order: Pick<OrderLike, "downloads" | "download_limit">): number {
  return Math.max(0, order.download_limit - order.downloads);
}

export function isOrderActive(order: Pick<OrderLike, "status" | "expires_at">, now: Date = new Date()): boolean {
  return order.status === "paid" && new Date(order.expires_at) > now;
}

/** Os endereços públicos da página do livro (capa, excerto, Kindle). */
export async function getBook() {
  const supabase = getPublicClient();
  let settings = parseBookSettings(null);
  let coverUrl: string | null = null;
  let excerptUrl: string | null = null;

  if (supabase) {
    const { data } = await supabase.from("settings").select("value").eq("key", "book").maybeSingle();
    settings = parseBookSettings(data?.value);
    const publicUrl = (path: string | null) =>
      path ? supabase.storage.from("covers").getPublicUrl(path).data.publicUrl : null;
    coverUrl = publicUrl(settings.cover_path);
    excerptUrl = publicUrl(settings.excerpt_path);
  }

  return {
    coverUrl,
    excerptUrl,
    kindleUrl: settings.kindle_url ?? (SITE.kindleUrl || null),
    hasBonus: Boolean(settings.bonus_content_id),
  };
}

/**
 * Regista a compra do eBook a partir de uma sessão de pagamento do Stripe já paga.
 * É seguro chamar várias vezes (página de obrigado e webhook): a mesma compra nunca se duplica.
 * Devolve o link secreto da compra, ou null se a sessão não for uma compra paga do eBook.
 */
export async function fulfillEbookSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  if (session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.product !== "ebook") {
    return null;
  }

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  const { data, error } = await admin
    .from("book_orders")
    .upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntent,
        email: session.customer_details?.email ?? session.customer_email ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        user_id: session.metadata?.user_id || null,
      },
      { onConflict: "stripe_session_id" },
    )
    .select("access_token")
    .single();

  if (error) throw new Error(`book order: ${error.message}`);
  return data.access_token as string;
}

/** Quando o Stripe reembolsa por inteiro uma compra, o link deixa de funcionar. */
export async function markEbookRefunded(admin: SupabaseClient, charge: Stripe.Charge): Promise<void> {
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent || !charge.refunded) return;
  await admin.from("book_orders").update({ status: "refunded" }).eq("stripe_payment_intent", paymentIntent);
}
