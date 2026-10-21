import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { Photo } from "@/components/Photo";
import { formatEUR, getPrices } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Quem Sou Eu? — o livro" };
export const revalidate = 300;

export default async function LivroPage() {
  const prices = await getPrices();

  return (
    <div className="wrap grid items-start gap-12 py-14 md:grid-cols-[1fr_1.4fr] md:py-20">
      <Photo
        src="/images/livro-capa.jpg"
        alt="Capa do livro Quem Sou Eu?"
        sizes="(min-width: 768px) 30vw, 70vw"
        className="mx-auto aspect-[2/3] w-full max-w-xs rounded-md shadow-xl"
      />
      <div>
        <h1 className="text-5xl md:text-6xl">Quem Sou Eu?</h1>
        <p className="mt-2 font-display text-2xl text-moss">Uma viagem ao coração do Yoga e da consciência.</p>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          Um livro para praticantes e para quem nunca colocou os pés num tapete, sobre as perguntas que atravessam
          a experiência humana.
        </p>

        <section id="excerto" className="mt-10">
          <h2 className="text-2xl">Ler um capítulo grátis</h2>
          <p className="mt-2 text-ink-soft">O excerto gratuito fica disponível aqui em breve.</p>
        </section>

        <section id="comprar" className="mt-10">
          <h2 className="text-2xl">Comprar o eBook — {formatEUR(prices.ebookCents)}</h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            A compra direta inclui uma meditação exclusiva. Não precisas de subscrição nem de criar conta.
            A compra online abre numa próxima fase.
          </p>
          {SITE.kindleUrl && (
            <div className="mt-6">
              <ButtonLink href={SITE.kindleUrl} external variant="secondary">
                Ver no Kindle
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
