import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Cliente Stripe (só servidor). Devolve null se a chave não estiver configurada. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}
