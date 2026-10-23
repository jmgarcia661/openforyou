import type { Metadata } from "next";
import Image from "next/image";
import { BuyEbook } from "@/components/book/BuyEbook";
import { ButtonLink } from "@/components/ButtonLink";
import { Photo } from "@/components/Photo";
import { getBook } from "@/lib/book";
import { formatEUR, getPrices } from "@/lib/pricing";

export const metadata: Metadata = { title: "Quem Sou Eu? — o livro" };
export const revalidate = 300;

export default async function LivroPage() {
  const [prices, book] = await Promise.all([getPrices(), getBook()]);
  const price = formatEUR(prices.ebookCents);

  return (
    <div className="wrap grid items-start gap-12 py-14 md:grid-cols-[1fr_1.4fr] md:py-20">
      {book.coverUrl ? (
        <div className="relative mx-auto aspect-[2/3] w-full max-w-xs overflow-hidden rounded-md shadow-xl">
          <Image src={book.coverUrl} alt="Capa do livro Quem Sou Eu?" fill unoptimized className="object-cover" />
        </div>
      ) : (
        <Photo
          src="/images/livro-capa.jpg"
          alt="Capa do livro Quem Sou Eu?"
          sizes="(min-width: 768px) 30vw, 70vw"
          className="mx-auto aspect-[2/3] w-full max-w-xs rounded-md shadow-xl"
        />
      )}

      <div>
        <h1 className="text-5xl md:text-6xl">Quem Sou Eu?</h1>
        <p className="mt-2 font-display text-2xl text-moss">Uma viagem ao coração do Yoga e da consciência.</p>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          Um livro para praticantes e para quem nunca colocou os pés num tapete, sobre as perguntas que atravessam a
          experiência humana.
        </p>

        <section id="excerto" aria-labelledby="excerpt-h" className="mt-10">
          <h2 id="excerpt-h" className="text-2xl">
            Ler um capítulo grátis
          </h2>
          {book.excerptUrl ? (
            <div className="mt-4">
              <ButtonLink href={book.excerptUrl} external variant="secondary">
                Ler o excerto
              </ButtonLink>
            </div>
          ) : (
            <p className="mt-2 text-ink-soft">O excerto gratuito fica disponível aqui em breve.</p>
          )}
        </section>

        <section id="comprar" aria-labelledby="buy-h" className="mt-10 rounded-3xl bg-sand p-6 md:p-8">
          <h2 id="buy-h" className="text-2xl">
            Comprar o eBook, {price}
          </h2>
          <ul className="mt-3 space-y-1 text-ink-soft">
            <li>Não precisas de conta nem de subscrição.</li>
            <li>Inclui uma meditação exclusiva.</li>
            <li>Recebes o acesso logo depois do pagamento.</li>
          </ul>
          <div className="mt-6">
            <BuyEbook priceLabel={price} />
          </div>
        </section>

        {book.kindleUrl && (
          <div className="mt-8">
            <ButtonLink href={book.kindleUrl} external variant="quiet">
              Ver no Kindle
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
