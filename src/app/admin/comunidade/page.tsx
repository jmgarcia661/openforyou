import type { Metadata } from "next";
import { ModerationMode } from "@/components/community/ModerationMode";
import { RowAction } from "@/components/community/RowAction";
import { requireAdmin } from "@/lib/admin";
import { COMMENT_COLUMNS, parseMode, POST_COLUMNS, timeAgo, type CommunityComment, type CommunityPost } from "@/lib/community";
import { getAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Comunidade" };
export const dynamic = "force-dynamic";

type Report = {
  id: string;
  reason: string;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
};

type Moderated = { user_id: string; status: string; until: string | null };

export default async function AdminComunidadePage() {
  const { supabase } = await requireAdmin();
  const now = new Date();

  const [{ data: settingRow }, { data: pendingRows }, { data: reportRows }, { data: recentRows }, { data: commentRows }, { data: modRows }] =
    await Promise.all([
      supabase.from("settings").select("value").eq("key", "community").maybeSingle(),
      supabase.from("community_posts").select(POST_COLUMNS).eq("status", "pending").order("created_at", { ascending: true }),
      supabase.from("community_reports").select("id, reason, created_at, post_id, comment_id").eq("status", "open").order("created_at", { ascending: true }),
      supabase.from("community_posts").select(POST_COLUMNS).eq("status", "published").order("created_at", { ascending: false }).limit(20),
      supabase.from("community_comments").select(COMMENT_COLUMNS).eq("status", "published").order("created_at", { ascending: false }).limit(15),
      supabase.from("member_moderation").select("user_id, status, until"),
    ]);

  const mode = parseMode(settingRow?.value);
  const pending = (pendingRows ?? []) as CommunityPost[];
  const reports = (reportRows ?? []) as Report[];
  const recent = (recentRows ?? []) as CommunityPost[];
  const recentComments = (commentRows ?? []) as CommunityComment[];
  const moderated = (modRows ?? []) as Moderated[];

  // O que foi denunciado
  const reportedPostIds = reports.map((r) => r.post_id).filter((v): v is string => Boolean(v));
  const reportedCommentIds = reports.map((r) => r.comment_id).filter((v): v is string => Boolean(v));
  const [{ data: rp }, { data: rc }, { data: names }] = await Promise.all([
    reportedPostIds.length
      ? supabase.from("community_posts").select(POST_COLUMNS).in("id", reportedPostIds)
      : Promise.resolve({ data: [] }),
    reportedCommentIds.length
      ? supabase.from("community_comments").select(COMMENT_COLUMNS).in("id", reportedCommentIds)
      : Promise.resolve({ data: [] }),
    moderated.length
      ? supabase.from("profiles").select("id, full_name").in("id", moderated.map((m) => m.user_id))
      : Promise.resolve({ data: [] }),
  ]);
  const postById = new Map(((rp ?? []) as CommunityPost[]).map((p) => [p.id, p]));
  const commentById = new Map(((rc ?? []) as CommunityComment[]).map((c) => [c.id, c]));
  const nameById = new Map(((names ?? []) as { id: string; full_name: string | null }[]).map((n) => [n.id, n.full_name ?? "Sem nome"]));

  // Fotografias das publicações a aguardar
  const signed = new Map<string, string>();
  const admin = getAdminClient();
  const paths = [...pending, ...recent].map((p) => p.image_path).filter((p): p is string => Boolean(p));
  if (admin && paths.length) {
    const { data } = await admin.storage.from("community").createSignedUrls(paths, 60 * 60);
    for (const item of data ?? []) if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
  }

  const suspend7 = (userId: string) =>
    [{ table: "member_moderation", kind: "upsert" as const, patch: { user_id: userId, status: "suspended", until: "$now+7d" }, onConflict: "user_id" }];
  const block = (userId: string) =>
    [{ table: "member_moderation", kind: "upsert" as const, patch: { user_id: userId, status: "blocked", until: null }, onConflict: "user_id" }];

  return (
    <div className="space-y-12">
      <h1 className="text-4xl md:text-5xl">Comunidade</h1>

      <section aria-labelledby="mode-h" className="space-y-3">
        <h2 id="mode-h" className="text-2xl">
          Moderação
        </h2>
        <p className="text-ink-soft">
          Por omissão as publicações aparecem logo e tu moderas depois. Se preferires, escolhe aprovar cada publicação
          antes de aparecer.
        </p>
        <ModerationMode mode={mode} />
      </section>

      <section aria-labelledby="pending-h" className="space-y-4">
        <h2 id="pending-h" className="text-2xl">
          A aguardar aprovação ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-ink-soft">Não há nada na fila.</p>
        ) : (
          pending.map((p) => (
            <article key={p.id} className="rounded-2xl border border-ink/15 p-5">
              <p className="text-sm text-ink-soft">
                {p.author_name} · {timeAgo(p.created_at, now)}
              </p>
              <p className="mt-2 whitespace-pre-line">{p.body}</p>
              {p.image_path && signed.get(p.image_path) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signed.get(p.image_path)} alt="Fotografia da publicação" className="mt-3 max-h-64 rounded-xl" />
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <RowAction
                  label="Aprovar"
                  tone="primary"
                  ops={[{ table: "community_posts", kind: "update", patch: { status: "published", moderator_note: null }, match: { id: p.id } }]}
                />
                <RowAction
                  label="Pedir alterações ou recusar"
                  promptNote="Escreve uma nota para o membro (aparece na publicação):"
                  ops={[{ table: "community_posts", kind: "update", patch: { status: "rejected", moderator_note: "$note" }, match: { id: p.id } }]}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <section aria-labelledby="reports-h" className="space-y-4">
        <h2 id="reports-h" className="text-2xl">
          Denúncias ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-ink-soft">Não há denúncias abertas.</p>
        ) : (
          reports.map((r) => {
            const post = r.post_id ? postById.get(r.post_id) : undefined;
            const comment = r.comment_id ? commentById.get(r.comment_id) : undefined;
            const authorId = post?.author_id ?? comment?.author_id;
            const handled = { table: "community_reports", kind: "update" as const, patch: { status: "handled" }, match: { id: r.id } };
            return (
              <article key={r.id} className="rounded-2xl border border-ink/15 p-5">
                <p className="text-sm text-ink-soft">
                  Denúncia de {post ? "publicação" : "comentário"} · {timeAgo(r.created_at, now)}
                </p>
                <p className="mt-1">
                  <strong>Motivo:</strong> {r.reason}
                </p>
                <p className="mt-3 rounded-xl bg-sand p-4 whitespace-pre-line">
                  <span className="text-sm text-ink-soft">{(post ?? comment)?.author_name}: </span>
                  {(post ?? comment)?.body ?? "Este conteúdo já não existe."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post && (
                    <RowAction
                      label="Retirar publicação"
                      tone="danger"
                      ops={[{ table: "community_posts", kind: "update", patch: { status: "removed" }, match: { id: post.id } }, handled]}
                    />
                  )}
                  {comment && (
                    <RowAction
                      label="Retirar comentário"
                      tone="danger"
                      ops={[{ table: "community_comments", kind: "update", patch: { status: "removed" }, match: { id: comment.id } }, handled]}
                    />
                  )}
                  <RowAction label="Ignorar denúncia" ops={[handled]} />
                  {authorId && <RowAction label="Suspender autor 7 dias" confirm="Suspender este membro durante 7 dias?" ops={[...suspend7(authorId), handled]} />}
                  {authorId && <RowAction label="Bloquear autor" tone="danger" confirm="Bloquear este membro da comunidade?" ops={[...block(authorId), handled]} />}
                </div>
              </article>
            );
          })
        )}
      </section>

      <section aria-labelledby="recent-h" className="space-y-4">
        <h2 id="recent-h" className="text-2xl">
          Publicações recentes
        </h2>
        {recent.length === 0 ? (
          <p className="text-ink-soft">Ainda não há publicações.</p>
        ) : (
          recent.map((p) => (
            <article key={p.id} className="rounded-2xl border border-ink/15 p-5">
              <p className="text-sm text-ink-soft">
                {p.author_name} · {timeAgo(p.created_at, now)}
                {p.pinned ? " · fixada" : ""}
                {p.comments_closed ? " · comentários fechados" : ""}
              </p>
              <p className="mt-2 whitespace-pre-line">{p.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <RowAction
                  label="Retirar"
                  tone="danger"
                  confirm="Retirar esta publicação?"
                  ops={[{ table: "community_posts", kind: "update", patch: { status: "removed" }, match: { id: p.id } }]}
                />
                <RowAction
                  label={p.pinned ? "Desafixar" : "Fixar no topo"}
                  ops={[{ table: "community_posts", kind: "update", patch: { pinned: !p.pinned }, match: { id: p.id } }]}
                />
                <RowAction
                  label={p.comments_closed ? "Abrir comentários" : "Fechar comentários"}
                  ops={[{ table: "community_posts", kind: "update", patch: { comments_closed: !p.comments_closed }, match: { id: p.id } }]}
                />
                <RowAction label="Suspender autor 7 dias" confirm="Suspender este membro durante 7 dias?" ops={suspend7(p.author_id)} />
              </div>
            </article>
          ))
        )}
      </section>

      <section aria-labelledby="comments-h" className="space-y-4">
        <h2 id="comments-h" className="text-2xl">
          Comentários recentes
        </h2>
        {recentComments.length === 0 ? (
          <p className="text-ink-soft">Ainda não há comentários.</p>
        ) : (
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {recentComments.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p>
                  <span className="font-medium">{c.author_name}:</span> {c.body}
                </p>
                <RowAction
                  label="Retirar"
                  tone="danger"
                  ops={[{ table: "community_comments", kind: "update", patch: { status: "removed" }, match: { id: c.id } }]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-h" className="space-y-4">
        <h2 id="members-h" className="text-2xl">
          Membros suspensos ou bloqueados
        </h2>
        {moderated.length === 0 ? (
          <p className="text-ink-soft">Ninguém está suspenso ou bloqueado.</p>
        ) : (
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {moderated.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p>
                  {nameById.get(m.user_id)} · {m.status === "blocked" ? "bloqueado" : `suspenso até ${m.until ? new Date(m.until).toLocaleDateString("pt-PT") : "sem data"}`}
                </p>
                <RowAction
                  label="Levantar"
                  ops={[{ table: "member_moderation", kind: "delete", match: { user_id: m.user_id } }]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
