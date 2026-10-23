import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { ItemActions } from "@/components/ItemActions";
import { ItemPlayer } from "@/components/ItemPlayer";
import { FULL_COLUMNS, KIND_SINGULAR, metaLine, type ContentRow } from "@/lib/content";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Praticar" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ItemPage({ params }: Props) {
  const { id } = await params;

  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/praticar/${id}`);

  // As regras da base de dados decidem o que cada pessoa pode ver:
  // se o conteúdo não vier, esta pessoa não tem acesso.
  const { data } = await supabase.from("content_items").select(FULL_COLUMNS).eq("id", id).maybeSingle();

  if (!data) {
    const { data: member } = await supabase.rpc("has_active_subscription");
    if (member) return notFound();
    return (
      <div className="wrap max-w-2xl py-20 text-center">
        <h1 className="text-4xl md:text-5xl">Este conteúdo é para membros</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          Com o acesso completo tens toda a biblioteca de Yoga, meditações e sons, as aulas em direto e a comunidade.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/acesso-completo">Ver o acesso completo</ButtonLink>
          <ButtonLink href="/praticar" variant="secondary">
            Voltar
          </ButtonLink>
        </div>
      </div>
    );
  }

  const item = data as ContentRow;

  // Link temporário do ficheiro: só é gerado depois de confirmado que esta pessoa pode ver o conteúdo.
  let src: string | null = null;
  const admin = getAdminClient();
  if (admin && item.media_path) {
    const { data: signed } = await admin.storage.from("media").createSignedUrl(item.media_path, 60 * 60 * 2);
    src = signed?.signedUrl ?? null;
  }

  const [{ data: fav }, { data: done }] = await Promise.all([
    supabase.from("favorites").select("content_id").eq("user_id", user.id).eq("content_id", id).maybeSingle(),
    supabase.from("completions").select("content_id").eq("user_id", user.id).eq("content_id", id).maybeSingle(),
  ]);

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <Link href="/praticar" className="text-sm underline underline-offset-4">
        Voltar à biblioteca
      </Link>
      <p className="mt-6 text-ink-soft">{KIND_SINGULAR[item.kind]}</p>
      <h1 className="mt-1 text-4xl md:text-6xl">{item.title}</h1>
      <p className="mt-3 text-ink-soft">{metaLine(item)}</p>

      <div className="mt-8">
        {src ? (
          <ItemPlayer kind={item.kind} title={item.title} src={src} />
        ) : (
          <p className="rounded-2xl bg-sand p-6 text-ink-soft">Este conteúdo ainda não tem ficheiro.</p>
        )}
      </div>

      <div className="mt-6">
        <ItemActions userId={user.id} contentId={item.id} initialFavorite={Boolean(fav)} initialCompleted={Boolean(done)} />
      </div>

      {item.description && <p className="mt-10 max-w-2xl text-lg">{item.description}</p>}
      {item.materials && (
        <p className="mt-6 text-ink-soft">
          <span className="font-medium text-ink">Materiais:</span> {item.materials}
        </p>
      )}
      {item.goal && (
        <p className="mt-2 text-ink-soft">
          <span className="font-medium text-ink">Objetivo:</span> {item.goal}
        </p>
      )}
      {item.transcript && (
        <details className="mt-8">
          <summary className="cursor-pointer font-medium">Transcrição</summary>
          <p className="mt-3 whitespace-pre-line text-ink-soft">{item.transcript}</p>
        </details>
      )}
    </div>
  );
}
