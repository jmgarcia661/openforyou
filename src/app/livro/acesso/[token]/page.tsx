import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { ItemPlayer } from "@/components/ItemPlayer";
import { isOrderActive, parseBookSettings, remainingDownloads } from "@/lib/book";
import { getAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "A tua compra", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
};

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="wrap max-w-2xl py-20 text-center">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">{text}</p>
    </div>
  );
}

export default async function AcessoPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { erro } = await searchParams;

  if (!/^[a-f0-9]{48}$/.test(token)) return notFound();
  const admin = getAdminClient();
  if (!admin) return notFound();

  const { data: order } = await admin
    .from("book_orders")
    .select("id, email, status, downloads, download_limit, expires_at")
    .eq("access_token", token)
    .maybeSingle();
  if (!order) return notFound();

  if (order.status === "refunded") {
    return <Notice title="Esta compra foi reembolsada" text="O acesso ao eBook e à meditação já não está disponível." />;
  }
  if (!isOrderActive(order)) {
    return <Notice title="Este link expirou" text="Escreve-nos e enviamos-te um novo acesso." />;
  }

  // Meditação exclusiva incluída na compra
  const { data: bookRow } = await admin.from("settings").select("value").eq("key", "book").maybeSingle();
  const bonusId = parseBookSettings(bookRow?.value).bonus_content_id;
  let bonus: { title: string; src: string } | null = null;
  if (bonusId) {
    const { data: item } = await admin.from("content_items").select("title, media_path").eq("id", bonusId).maybeSingle();
    if (item?.media_path) {
      const { data: signed } = await admin.storage.from("media").createSignedUrl(item.media_path, 60 * 60 * 2);
      if (signed?.signedUrl) bonus = { title: item.title as string, src: signed.signedUrl };
    }
  }

  const remaining = remainingDownloads(order);

  return (
    <div className="wrap max-w-2xl py-14 md:py-20">
      <h1 className="text-4xl md:text-6xl">Obrigado pela tua compra.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Guarda esta página: é o teu acesso privado ao eBook e à meditação exclusiva. O link é pessoal, por isso não o partilhes.
      </p>

      {erro === "download" && (
        <p role="alert" className="mt-6 rounded-xl bg-clay/10 px-4 py-3 text-clay-dark">
          Não foi possível descarregar agora. Pode ter acabado o número de downloads, ou o ficheiro ainda não está disponível.
          Escreve-nos e ajudamos.
        </p>
      )}

      <section aria-labelledby="ebook-h" className="mt-10 rounded-3xl bg-sand p-6 md:p-8">
        <h2 id="ebook-h" className="text-2xl">
          O teu eBook
        </h2>
        <p className="mt-2 text-ink-soft">
          Tens {remaining} {remaining === 1 ? "download" : "downloads"} disponíveis neste link.
        </p>
        {remaining > 0 && (
          <div className="mt-5">
            <ButtonLink href={`/livro/download/${token}`}>Descarregar o eBook</ButtonLink>
          </div>
        )}
      </section>

      {bonus && (
        <section aria-labelledby="bonus-h" className="mt-8 rounded-3xl bg-moss-soft p-6 md:p-8">
          <h2 id="bonus-h" className="text-2xl">
            Meditação exclusiva
          </h2>
          <p className="mt-2 text-ink-soft">{bonus.title}</p>
          <div className="mt-5">
            <ItemPlayer kind="meditation" title={bonus.title} src={bonus.src} />
          </div>
        </section>
      )}

      <section aria-labelledby="next-h" className="mt-12 border-t border-ink/15 pt-8">
        <h2 id="next-h" className="text-2xl">
          E agora?
        </h2>
        <p className="mt-2 text-ink-soft">
          Cria uma conta gratuita para guardar as práticas da semana, ou conhece o acesso completo, com aulas ao vivo,
          biblioteca e comunidade.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/registo" variant="secondary">
            Criar conta gratuita
          </ButtonLink>
          <ButtonLink href="/acesso-completo" variant="secondary">
            Conhecer o acesso completo
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
