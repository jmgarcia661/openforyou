"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { checkImage, type ModerationMode } from "@/lib/community";
import { getBrowserClient } from "@/lib/supabase/browser";
import { communityPostSchema } from "@/lib/validation";

type Props = {
  userId: string;
  theme: string | null;
  mode: ModerationMode;
  rulesAccepted: boolean;
};

export function Composer({ userId, theme, mode, rulesAccepted }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasFile, setHasFile] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone("");
    const form = new FormData(e.currentTarget);

    const parsed = communityPostSchema.safeParse({ body: String(form.get("body") ?? "") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    const image = form.get("image");
    const file = image instanceof File && image.size > 0 ? image : null;
    if (file) {
      const problem = checkImage(file);
      if (problem) {
        setError(problem);
        return;
      }
      if (form.get("photoConsent") !== "on") {
        setError("Confirma que podes partilhar esta fotografia na comunidade.");
        return;
      }
    }
    if (!rulesAccepted && form.get("rules") !== "on") {
      setError("Para publicar, aceita as regras da comunidade.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setError("A comunidade não está disponível neste momento.");
      return;
    }

    setPending(true);
    let imagePath: string | null = null;
    if (file) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      imagePath = `${userId}/${crypto.randomUUID()}-${safe}`;
      const { error: upError } = await supabase.storage
        .from("community")
        .upload(imagePath, file, { contentType: file.type, upsert: false });
      if (upError) {
        setPending(false);
        setError(`Não foi possível carregar a fotografia: ${upError.message}`);
        return;
      }
    }

    const { error: dbError } = await supabase.from("community_posts").insert({
      author_id: userId,
      body: parsed.data.body,
      image_path: imagePath,
      photo_consent: Boolean(file),
      theme: form.get("useTheme") === "on" ? theme : null,
    });
    if (dbError) {
      setPending(false);
      setError("Não foi possível publicar. Tenta novamente.");
      return;
    }

    if (!rulesAccepted) {
      await supabase.from("profiles").update({ community_rules_accepted_at: new Date().toISOString() }).eq("id", userId);
    }

    formRef.current?.reset();
    setHasFile(false);
    setPending(false);
    setDone(mode === "before" ? "Obrigado. A tua publicação ficou a aguardar aprovação." : "Publicado.");
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-sand p-5 md:p-6" noValidate>
      <label htmlFor="body" className="sr-only">
        A tua mensagem
      </label>
      <textarea
        id="body"
        name="body"
        rows={4}
        placeholder="Partilha uma reflexão, uma dúvida ou um momento da tua prática."
        className="w-full rounded-xl border border-ink/25 bg-paper px-4 py-3 text-base"
      />

      <div>
        <label htmlFor="image" className="mb-1 block text-sm font-medium">
          Fotografia (opcional)
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setHasFile(Boolean(e.target.files?.length))}
          className="block w-full text-sm"
        />
      </div>

      {hasFile && (
        <label className="flex items-start gap-3 text-sm">
          <input name="photoConsent" type="checkbox" className="mt-1 size-4 accent-clay" />
          <span>
            Esta fotografia é minha ou tenho autorização de quem aparece nela, e aceito que fique visível na comunidade
            privada. Nunca é usada publicamente.
          </span>
        </label>
      )}

      {theme && (
        <label className="flex items-start gap-3 text-sm">
          <input name="useTheme" type="checkbox" className="mt-1 size-4 accent-clay" />
          <span>Responder ao tema desta semana: {theme}</span>
        </label>
      )}

      {!rulesAccepted && (
        <label className="flex items-start gap-3 text-sm">
          <input name="rules" type="checkbox" className="mt-1 size-4 accent-clay" />
          <span>
            Li e aceito as{" "}
            <Link href="/regras-da-comunidade" className="underline underline-offset-4">
              regras da comunidade
            </Link>
            .
          </span>
        </label>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {done && <Notice kind="success">{done}</Notice>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center rounded-full bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
      >
        {pending ? "A publicar" : "Publicar"}
      </button>
    </form>
  );
}
