import { getPublicClient } from "./supabase/public";

export type Prices = {
  monthlyCents: number;
  firstMonthCents: number;
  ebookCents: number;
};

export const DEFAULT_PRICES: Prices = {
  monthlyCents: 5900,
  firstMonthCents: 3900,
  ebookCents: 1400,
};

/** Formata cêntimos como euros: 5900 -> "59 €", 1450 -> "14,50 €". */
export function formatEUR(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function isPrices(value: unknown): value is Prices {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isInteger(v.monthlyCents) &&
    Number.isInteger(v.firstMonthCents) &&
    Number.isInteger(v.ebookCents)
  );
}

/** Lê os preços da tabela settings; usa os valores por omissão se falhar. */
export async function getPrices(): Promise<Prices> {
  const supabase = getPublicClient();
  if (!supabase) return DEFAULT_PRICES;
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "prices")
    .maybeSingle();
  if (error || !isPrices(data?.value)) return DEFAULT_PRICES;
  return data.value;
}
