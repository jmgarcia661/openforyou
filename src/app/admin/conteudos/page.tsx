import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { requireAdmin } from "@/lib/admin";
import { ACCESS_LABEL, isKind, KIND_LABEL, KIND_SINGULAR, KINDS, LIST_COLUMNS, STATUS_LABEL, type ContentRow } from "@/lib/content";

export const metadata: Metadata = { title: "Conteúdos" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tipo?: string }> };

export default async function ConteudosPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { tipo } = await searchParams;

  let query = supabase.from("content_items").select(LIST_COLUMNS).order("created_at", { ascending: false });
  if (isKind(tipo)) query = query.eq("kind", tipo);
  const { data } = await query;
  const items = (data ?? []) as ContentRow[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl md:text-5xl">Conteúdos</h1>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <ButtonLink key={k} href={`/admin/conteudos/novo?tipo=${k}`} size="sm">
              Adicionar {KIND_SINGULAR[k].toLowerCase()}
            </ButtonLink>
          ))}
        </div>
      </div>

      <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/conteudos" className={`rounded-full px-4 py-2 ${!isKind(tipo) ? "bg-ink text-paper" : "bg-sand"}`}>
          Todos
        </Link>
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/admin/conteudos?tipo=${k}`}
            className={`rounded-full px-4 py-2 ${tipo === k ? "bg-ink text-paper" : "bg-sand"}`}
          >
            {KIND_LABEL[k]}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="text-ink-soft">Ainda não há conteúdos. Começa por adicionar uma aula, uma meditação ou um som.</p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-ink-soft">
                  {KIND_SINGULAR[item.kind]} · {STATUS_LABEL[item.status] ?? item.status} · {ACCESS_LABEL[item.access]}
                  {item.duration_min ? ` · ${item.duration_min} min` : ""}
                </p>
              </div>
              <ButtonLink href={`/admin/conteudos/${item.id}`} variant="secondary" size="sm">
                Editar
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
