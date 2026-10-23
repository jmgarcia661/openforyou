"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { KIND_SINGULAR, KINDS, type ContentKind, type ContentRow } from "@/lib/content";
import { getBrowserClient } from "@/lib/supabase/browser";
import { contentSchema } from "@/lib/validation";

const INPUT = "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base";
const AREA = "w-full rounded-xl border border-ink/25 bg-paper px-4 py-3 text-base";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = { initial?: ContentRow; defaultKind: ContentKind };

export function ContentForm({ initial, defaultKind }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const parsed = contentSchema.safeParse({
      kind: text(form, "kind"),
      title: text(form, "title"),
      description: text(form, "description"),
      duration: text(form, "duration"),
      teacher: text(form, "teacher"),
      level: text(form, "level"),
      intensity: text(form, "intensity"),
      goal: text(form, "goal"),
      materials: text(form, "materials"),
      transcript: text(form, "transcript"),
      access: text(form, "access"),
      status: text(form, "status"),
      publishAt: text(form, "publishAt"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setError("O Supabase não está configurado.");
      return;
    }

    setPending(true);
    try {
      const upload = async (bucket: "media" | "covers", file: File, kind: string) => {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const path = `${kind}/${crypto.randomUUID()}-${safe}`;
        const { error: upError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (upError) {
          if (upError.message.toLowerCase().includes("size")) {
            throw new Error("O ficheiro é maior do que o limite do plano do Supabase (50 MB no plano gratuito).");
          }
          throw new Error(`Não foi possível carregar o ficheiro: ${upError.message}`);
        }
        return path;
      };

      const d = parsed.data;
      let mediaPath = initial?.media_path ?? null;
      let coverPath = initial?.cover_path ?? null;

      const mediaFile = form.get("media");
      if (mediaFile instanceof File && mediaFile.size > 0) {
        mediaPath = await upload("media", mediaFile, d.kind);
      }
      const coverFile = form.get("cover");
      if (coverFile instanceof File && coverFile.size > 0) {
        coverPath = await upload("covers", coverFile, d.kind);
      }

      const row = {
        kind: d.kind,
        title: d.title,
        description: d.description || null,
        duration_min: d.duration ? Number(d.duration) : null,
        teacher: d.teacher || null,
        level: d.level || null,
        intensity: d.intensity || null,
        goal: d.goal || null,
        materials: d.materials || null,
        transcript: d.transcript || null,
        access: d.access,
        status: d.status,
        publish_at: d.publishAt ? new Date(d.publishAt).toISOString() : null,
        media_path: mediaPath,
        cover_path: coverPath,
      };

      const { error: dbError } = initial
        ? await supabase.from("content_items").update(row).eq("id", initial.id)
        : await supabase.from("content_items").insert(row);
      if (dbError) throw new Error(`Não foi possível guardar: ${dbError.message}`);

      router.push("/admin/conteudos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro. Tenta novamente.");
      setPending(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Eliminar este conteúdo? Esta ação não pode ser desfeita.")) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { error: dbError } = await supabase.from("content_items").delete().eq("id", initial.id);
    if (dbError) {
      setError(`Não foi possível eliminar: ${dbError.message}`);
      return;
    }
    router.push("/admin/conteudos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="mb-1 block text-sm font-medium">
            Tipo
          </label>
          <select id="kind" name="kind" defaultValue={initial?.kind ?? defaultKind} className={INPUT}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_SINGULAR[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium">
            Duração (minutos)
          </label>
          <input id="duration" name="duration" inputMode="numeric" defaultValue={initial?.duration_min ?? ""} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Título
        </label>
        <input id="title" name="title" defaultValue={initial?.title ?? ""} className={INPUT} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Descrição
        </label>
        <textarea id="description" name="description" rows={4} defaultValue={initial?.description ?? ""} className={AREA} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="teacher" className="mb-1 block text-sm font-medium">
            Professor
          </label>
          <input id="teacher" name="teacher" defaultValue={initial?.teacher ?? "José Maria Garcia"} className={INPUT} />
        </div>
        <div>
          <label htmlFor="goal" className="mb-1 block text-sm font-medium">
            Objetivo
          </label>
          <input id="goal" name="goal" defaultValue={initial?.goal ?? ""} placeholder="Costas e ombros" className={INPUT} />
        </div>
        <div>
          <label htmlFor="level" className="mb-1 block text-sm font-medium">
            Nível
          </label>
          <select id="level" name="level" defaultValue={initial?.level ?? ""} className={INPUT}>
            <option value="">Sem nível</option>
            <option>Todos os níveis</option>
            <option>Iniciante</option>
            <option>Intermédio</option>
            <option>Avançado</option>
          </select>
        </div>
        <div>
          <label htmlFor="intensity" className="mb-1 block text-sm font-medium">
            Intensidade
          </label>
          <select id="intensity" name="intensity" defaultValue={initial?.intensity ?? ""} className={INPUT}>
            <option value="">Sem intensidade</option>
            <option>Suave</option>
            <option>Moderada</option>
            <option>Intensa</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="materials" className="mb-1 block text-sm font-medium">
          Materiais necessários
        </label>
        <input id="materials" name="materials" defaultValue={initial?.materials ?? ""} placeholder="Tapete, bloco, manta" className={INPUT} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="media" className="mb-1 block text-sm font-medium">
            Ficheiro de vídeo ou áudio
          </label>
          <input id="media" name="media" type="file" accept="video/*,audio/*" className="block w-full text-sm" />
          {initial?.media_path && <p className="mt-1 text-sm text-ink-soft">Ficheiro atual: {initial.media_path}</p>}
        </div>
        <div>
          <label htmlFor="cover" className="mb-1 block text-sm font-medium">
            Capa (imagem)
          </label>
          <input id="cover" name="cover" type="file" accept="image/*" className="block w-full text-sm" />
          {initial?.cover_path && <p className="mt-1 text-sm text-ink-soft">Capa atual: {initial.cover_path}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="access" className="mb-1 block text-sm font-medium">
            Acesso
          </label>
          <select id="access" name="access" defaultValue={initial?.access ?? "premium"} className={INPUT}>
            <option value="premium">Só membros</option>
            <option value="free">Sempre gratuito</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Estado
          </label>
          <select id="status" name="status" defaultValue={initial?.status === "scheduled" ? "published" : (initial?.status ?? "draft")} className={INPUT}>
            <option value="draft">Rascunho</option>
            <option value="review">Em revisão</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div>
          <label htmlFor="publishAt" className="mb-1 block text-sm font-medium">
            Publicar a partir de
          </label>
          <input id="publishAt" name="publishAt" type="datetime-local" defaultValue={toLocalInput(initial?.publish_at)} className={INPUT} />
        </div>
      </div>
      <p className="text-sm text-ink-soft">
        Para agendar, escolhe o estado Publicado e uma data futura. O conteúdo só aparece aos membros a partir dessa data.
      </p>

      <div>
        <label htmlFor="transcript" className="mb-1 block text-sm font-medium">
          Transcrição (opcional)
        </label>
        <textarea id="transcript" name="transcript" rows={5} defaultValue={initial?.transcript ?? ""} className={AREA} />
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-60">
          <SubmitButton pending={pending}>{pending ? "A guardar" : "Guardar"}</SubmitButton>
        </div>
        {initial && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-12 items-center justify-center rounded-full border border-clay-dark px-6 font-medium text-clay-dark transition-colors hover:bg-clay/10"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
