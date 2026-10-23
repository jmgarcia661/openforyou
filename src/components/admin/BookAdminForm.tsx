"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { centsToInput, parsePriceToCents, type BookSettings } from "@/lib/book";
import { getBrowserClient } from "@/lib/supabase/browser";

const INPUT = "h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base";

type Props = {
  priceCents: number;
  prices: { monthlyCents: number; firstMonthCents: number; ebookCents: number };
  settings: BookSettings;
  fileName: string | null;
  meditations: { id: string; title: string }[];
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const fileOf = (form: FormData, key: string): File | null => {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
};

export function BookAdminForm({ priceCents, prices, settings, fileName, meditations }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const form = new FormData(e.currentTarget);

    const cents = parsePriceToCents(text(form, "price"));
    if (cents === null) {
      setFeedback({ kind: "error", text: "Indica um preço entre 1 € e 500 €, por exemplo 14 ou 14,50." });
      return;
    }
    const kindle = text(form, "kindle");
    if (kindle && !/^https?:\/\//i.test(kindle)) {
      setFeedback({ kind: "error", text: "O link do Kindle tem de começar por https://." });
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setFeedback({ kind: "error", text: "O Supabase não está configurado." });
      return;
    }

    setPending(true);
    try {
      const upload = async (bucket: "covers" | "ebook", file: File, prefix: string) => {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const path = `${prefix}${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined });
        if (error) throw new Error(`Não foi possível carregar o ficheiro: ${error.message}`);
        return path;
      };

      let coverPath = settings.cover_path;
      let excerptPath = settings.excerpt_path;
      const cover = fileOf(form, "cover");
      const excerpt = fileOf(form, "excerpt");
      const ebook = fileOf(form, "ebook");

      if (cover) coverPath = await upload("covers", cover, "book/cover-");
      if (excerpt) excerptPath = await upload("covers", excerpt, "book/excerpt-");

      if (ebook) {
        const path = await upload("ebook", ebook, "");
        const { error } = await supabase
          .from("book_files")
          .upsert({ id: 1, file_path: path, file_name: ebook.name }, { onConflict: "id" });
        if (error) throw new Error(`Não foi possível guardar o eBook: ${error.message}`);
      }

      const { error: settingsError } = await supabase.from("settings").upsert(
        {
          key: "book",
          value: {
            cover_path: coverPath,
            excerpt_path: excerptPath,
            kindle_url: kindle || null,
            bonus_content_id: text(form, "bonus") || null,
          },
        },
        { onConflict: "key" },
      );
      if (settingsError) throw new Error(`Não foi possível guardar: ${settingsError.message}`);

      const { error: priceError } = await supabase
        .from("settings")
        .upsert({ key: "prices", value: { ...prices, ebookCents: cents } }, { onConflict: "key" });
      if (priceError) throw new Error(`Não foi possível guardar o preço: ${priceError.message}`);

      setFeedback({ kind: "success", text: "Guardado." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Ocorreu um erro. Tenta novamente." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">
            Preço do eBook (€)
          </label>
          <input id="price" name="price" inputMode="decimal" defaultValue={centsToInput(priceCents)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="kindle" className="mb-1 block text-sm font-medium">
            Link do Kindle
          </label>
          <input id="kindle" name="kindle" defaultValue={settings.kindle_url ?? ""} placeholder="https://" className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="bonus" className="mb-1 block text-sm font-medium">
          Meditação exclusiva incluída na compra
        </label>
        <select id="bonus" name="bonus" defaultValue={settings.bonus_content_id ?? ""} className={INPUT}>
          <option value="">Nenhuma</option>
          {meditations.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-ink-soft">
          Primeiro adiciona a meditação em Conteúdos (com ficheiro de áudio) e escolhe-a aqui. Quem compra o livro ouve-a
          sem ter subscrição.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="ebook" className="mb-1 block text-sm font-medium">
            Ficheiro do eBook (PDF ou EPUB)
          </label>
          <input id="ebook" name="ebook" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" className="block w-full text-sm" />
          <p className="mt-1 text-sm text-ink-soft">{fileName ? `Atual: ${fileName}` : "Ainda não carregaste o eBook."}</p>
        </div>
        <div>
          <label htmlFor="excerpt" className="mb-1 block text-sm font-medium">
            Excerto gratuito (PDF)
          </label>
          <input id="excerpt" name="excerpt" type="file" accept=".pdf,application/pdf" className="block w-full text-sm" />
          <p className="mt-1 text-sm text-ink-soft">{settings.excerpt_path ? "Já existe um excerto." : "Sem excerto."}</p>
        </div>
        <div>
          <label htmlFor="cover" className="mb-1 block text-sm font-medium">
            Capa (imagem)
          </label>
          <input id="cover" name="cover" type="file" accept="image/*" className="block w-full text-sm" />
          <p className="mt-1 text-sm text-ink-soft">{settings.cover_path ? "Já existe uma capa." : "Sem capa."}</p>
        </div>
      </div>

      {feedback && <Notice kind={feedback.kind}>{feedback.text}</Notice>}
      <div className="sm:w-60">
        <SubmitButton pending={pending}>{pending ? "A guardar" : "Guardar"}</SubmitButton>
      </div>
    </form>
  );
}
