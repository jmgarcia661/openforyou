import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { ContentCard } from "@/components/ContentCard";
import { coverUrl, isKind, KIND_LABEL, KINDS, LIST_COLUMNS, type ContentRow } from "@/lib/content";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Praticar" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tipo?: string }> };

export default async function PraticarPage({ searchParams }: Props) {
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/praticar");

  const { tipo } = await searchParams;
  const { data: member } = await supabase.rpc("has_active_subscription");

  let items: ContentRow[] = [];
  if (tipo === "favoritos") {
    const { data: favs } = await supabase.from("favorites").select("content_id").eq("user_id", user.id);
    const ids = (favs ?? []).map((f) => f.content_id as string);
    if (ids.length > 0) {
      const { data } = await supabase
        .from("content_items")
        .select(LIST_COLUMNS)
        .eq("status", "published")
        .in("id", ids);
      items = (data ?? []) as ContentRow[];
    }
  } else {
    let query = supabase
      .from("content_items")
      .select(LIST_COLUMNS)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (isKind(tipo)) query = query.eq("kind", tipo);
    const { data } = await query;
    items = (data ?? []) as ContentRow[];
  }

  const tabs: { href: string; label: string; active: boolean }[] = [
    { href: "/praticar", label: "Tudo", active: !tipo },
    ...KINDS.map((k) => ({ href: `/praticar?tipo=${k}`, label: KIND_LABEL[k], active: tipo === k })),
    { href: "/praticar?tipo=favoritos", label: "Favoritos", active: tipo === "favoritos" },
  ];

  return (
    <div className="wrap py-12 md:py-16">
      <h1 className="text-5xl md:text-6xl">Praticar</h1>

      {!member && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-sand p-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl">
            Estás a ver os conteúdos gratuitos. Com o acesso completo tens toda a biblioteca, as aulas em direto e a comunidade.
          </p>
          <ButtonLink href="/acesso-completo">Ver o acesso completo</ButtonLink>
        </div>
      )}

      <nav aria-label="Filtrar" className="mt-8 flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`rounded-full px-4 py-2 ${t.active ? "bg-ink text-paper" : "bg-sand"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="mt-10 text-lg text-ink-soft">
          {tipo === "favoritos" ? "Ainda não guardaste nenhum favorito." : "Ainda não há conteúdos nesta secção."}
        </p>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} cover={coverUrl(supabase, item.cover_path)} />
          ))}
        </div>
      )}
    </div>
  );
}
