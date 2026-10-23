import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Composer } from "@/components/community/Composer";
import { CommentForm } from "@/components/community/CommentForm";
import { EditPost } from "@/components/community/EditPost";
import { ReactButton } from "@/components/community/ReactButton";
import { ReportButton } from "@/components/community/ReportButton";
import { RowAction } from "@/components/community/RowAction";
import { MembersOnly } from "@/components/MembersOnly";
import {
  COMMENT_COLUMNS,
  parseMode,
  POST_COLUMNS,
  STATUS_NOTE,
  timeAgo,
  type CommunityComment,
  type CommunityPost,
} from "@/lib/community";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comunidade" };
export const dynamic = "force-dynamic";

export default async function ComunidadePage() {
  const supabase = await getServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/comunidade");

  const { data: access } = await supabase.rpc("community_access");
  if (!access) {
    const { data: restriction } = await supabase.from("member_moderation").select("status").eq("user_id", user.id).maybeSingle();
    if (restriction) {
      return (
        <div className="wrap max-w-2xl py-20 text-center">
          <h1 className="text-4xl md:text-5xl">O teu acesso à comunidade está suspenso</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
            Se achas que foi um engano, responde ao último email que recebeste de nós ou contacta-nos.
          </p>
        </div>
      );
    }
    return <MembersOnly title="A comunidade é para membros" />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: isAdmin }, { data: settingRow }, { data: profile }, { data: week }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("settings").select("value").eq("key", "community").maybeSingle(),
    supabase.from("profiles").select("community_rules_accepted_at").eq("id", user.id).maybeSingle(),
    supabase.from("weekly_free").select("theme").lte("starts_on", today).gte("ends_on", today).order("starts_on", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const mode = parseMode(settingRow?.value);
  const theme: string | null = week?.theme ?? null;

  const { data: postRows } = await supabase
    .from("community_posts")
    .select(POST_COLUMNS)
    .neq("status", "removed")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);
  // O administrador consegue ler tudo; no feed só aparece o que está publicado, mais o que é seu.
  const posts = ((postRows ?? []) as CommunityPost[]).filter((p) => p.status === "published" || p.author_id === user.id);
  const ids = posts.map((p) => p.id);

  const [{ data: commentRows }, { data: reactionRows }] = ids.length
    ? await Promise.all([
        supabase.from("community_comments").select(COMMENT_COLUMNS).in("post_id", ids).eq("status", "published").order("created_at", { ascending: true }),
        supabase.from("community_reactions").select("post_id, user_id").in("post_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const comments = (commentRows ?? []) as CommunityComment[];
  const reactions = (reactionRows ?? []) as { post_id: string; user_id: string }[];

  // Links temporários das fotografias (o bucket é privado).
  const signed = new Map<string, string>();
  const admin = getAdminClient();
  const paths = posts.map((p) => p.image_path).filter((p): p is string => Boolean(p));
  if (admin && paths.length) {
    const { data } = await admin.storage.from("community").createSignedUrls(paths, 60 * 60 * 2);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  const now = new Date();

  return (
    <div className="wrap max-w-2xl py-12 md:py-16">
      <h1 className="text-5xl md:text-6xl">Comunidade</h1>
      <p className="mt-3 text-ink-soft">
        Um espaço privado e próximo. Lê as{" "}
        <Link href="/regras-da-comunidade" className="underline underline-offset-4">
          regras da comunidade
        </Link>
        .
      </p>

      {theme && (
        <p className="mt-6 rounded-2xl bg-moss-soft p-5 text-lg text-moss">
          Tema desta semana: <strong>{theme}</strong>
        </p>
      )}

      <div className="mt-8">
        <Composer userId={user.id} theme={theme} mode={mode} rulesAccepted={Boolean(profile?.community_rules_accepted_at)} />
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-lg text-ink-soft">Ainda não há publicações. Sê a primeira pessoa a partilhar.</p>
      ) : (
        <div className="mt-12 space-y-8">
          {posts.map((post) => {
            const own = post.author_id === user.id;
            const myComments = comments.filter((c) => c.post_id === post.id);
            const count = reactions.filter((r) => r.post_id === post.id).length;
            const reacted = reactions.some((r) => r.post_id === post.id && r.user_id === user.id);
            const image = post.image_path ? signed.get(post.image_path) : null;

            return (
              <article key={post.id} className="rounded-3xl border border-ink/15 p-5 md:p-6">
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {post.author_name}
                    {post.pinned && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-xs">Fixada</span>}
                  </p>
                  <p className="text-sm text-ink-soft">{timeAgo(post.created_at, now)}</p>
                </header>

                {post.theme && <p className="mt-1 text-sm text-moss">Tema: {post.theme}</p>}

                {post.status !== "published" && (
                  <p role="status" className="mt-3 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-dark">
                    {STATUS_NOTE[post.status]}
                    {post.moderator_note ? ` Nota: ${post.moderator_note}` : ""}
                  </p>
                )}

                <p className="mt-4 whitespace-pre-line text-lg">{post.body}</p>

                {image && (
                  <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
                    <Image src={image} alt="Fotografia partilhada na comunidade" fill unoptimized className="object-cover" />
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {post.status === "published" && <ReactButton postId={post.id} userId={user.id} count={count} reacted={reacted} />}
                  {own && <EditPost postId={post.id} body={post.body} />}
                  {own && (
                    <RowAction
                      label="Eliminar"
                      tone="danger"
                      confirm="Eliminar esta publicação?"
                      ops={[{ table: "community_posts", kind: "delete", match: { id: post.id } }]}
                    />
                  )}
                  {!own && post.status === "published" && <ReportButton userId={user.id} postId={post.id} />}
                  {isAdmin && !own && (
                    <RowAction
                      label="Retirar"
                      tone="danger"
                      confirm="Retirar esta publicação?"
                      ops={[{ table: "community_posts", kind: "update", patch: { status: "removed" }, match: { id: post.id } }]}
                    />
                  )}
                </div>

                {post.status === "published" && (
                  <section aria-label="Comentários" className="mt-5 space-y-3 border-t border-ink/15 pt-4">
                    {myComments.map((c) => (
                      <div key={c.id} className="text-sm">
                        <p>
                          <span className="font-medium">{c.author_name}</span>{" "}
                          <span className="text-ink-soft">{timeAgo(c.created_at, now)}</span>
                        </p>
                        <p className="mt-0.5 whitespace-pre-line">{c.body}</p>
                        <div className="mt-1 flex gap-3">
                          {(c.author_id === user.id || isAdmin) && (
                            <RowAction
                              label="Apagar"
                              tone="danger"
                              confirm="Apagar este comentário?"
                              ops={[{ table: "community_comments", kind: "delete", match: { id: c.id } }]}
                            />
                          )}
                          {c.author_id !== user.id && <ReportButton userId={user.id} commentId={c.id} />}
                        </div>
                      </div>
                    ))}
                    {post.comments_closed ? (
                      <p className="text-sm text-ink-soft">Os comentários desta publicação estão fechados.</p>
                    ) : (
                      <CommentForm postId={post.id} userId={user.id} />
                    )}
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
