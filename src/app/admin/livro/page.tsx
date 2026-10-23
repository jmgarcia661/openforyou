import type { Metadata } from "next";
import { BookAdminForm } from "@/components/admin/BookAdminForm";
import { requireAdmin } from "@/lib/admin";
import { parseBookSettings } from "@/lib/book";
import { getPrices, formatEUR } from "@/lib/pricing";

export const metadata: Metadata = { title: "Livro" };
export const dynamic = "force-dynamic";

type Order = {
  id: string;
  email: string | null;
  amount_cents: number;
  status: string;
  downloads: number;
  download_limit: number;
  created_at: string;
};

export default async function AdminLivroPage() {
  const { supabase } = await requireAdmin();

  const [prices, { data: settingRow }, { data: fileRow }, { data: meds }, { data: orderRows }] = await Promise.all([
    getPrices(),
    supabase.from("settings").select("value").eq("key", "book").maybeSingle(),
    supabase.from("book_files").select("file_name").eq("id", 1).maybeSingle(),
    supabase.from("content_items").select("id, title").eq("kind", "meditation").eq("status", "published").order("title"),
    supabase
      .from("book_orders")
      .select("id, email, amount_cents, status, downloads, download_limit, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const orders = (orderRows ?? []) as Order[];
  const paid = orders.filter((o) => o.status === "paid");

  return (
    <div className="max-w-3xl space-y-12">
      <h1 className="text-4xl md:text-5xl">Livro</h1>

      <section aria-labelledby="config-h" className="space-y-6">
        <h2 id="config-h" className="text-2xl">
          Configuração
        </h2>
        <BookAdminForm
          priceCents={prices.ebookCents}
          prices={prices}
          settings={parseBookSettings(settingRow?.value)}
          fileName={(fileRow?.file_name as string | null) ?? null}
          meditations={(meds ?? []) as { id: string; title: string }[]}
        />
      </section>

      <section aria-labelledby="orders-h" className="space-y-4">
        <h2 id="orders-h" className="text-2xl">
          Compras ({paid.length} pagas)
        </h2>
        {orders.length === 0 ? (
          <p className="text-ink-soft">Ainda não há compras.</p>
        ) : (
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{o.email ?? "Sem email"}</p>
                  <p className="text-sm text-ink-soft">
                    {new Date(o.created_at).toLocaleString("pt-PT")} · {formatEUR(o.amount_cents)} · downloads {o.downloads}/
                    {o.download_limit}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm ${o.status === "paid" ? "bg-moss-soft text-moss" : "bg-clay/10 text-clay-dark"}`}>
                  {o.status === "paid" ? "Paga" : "Reembolsada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
