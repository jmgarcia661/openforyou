import { ButtonLink } from "@/components/ButtonLink";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Photo } from "@/components/Photo";
import { Pricing } from "@/components/Pricing";
import { WeeklyCards } from "@/components/WeeklyCards";
import { formatEUR, getPrices } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { getWeeklyFree } from "@/lib/weekly";

export const revalidate = 300;

const PATHS = [
  { name: "Corpo", text: "Yoga, movimento e respiração para recuperares energia e escutares o corpo." },
  { name: "Mente", text: "Meditação, silêncio e reflexão para encontrares clareza." },
  { name: "Mundo", text: "Natureza, relações e comunidade para levares a prática para além do tapete." },
];

export default async function HomePage() {
  const [weekly, prices] = await Promise.all([getWeeklyFree(), getPrices()]);

  return (
    <>
      {/* 4.1 Abertura */}
      <section aria-labelledby="hero-title" className="wrap grid items-center gap-10 pb-16 pt-12 md:grid-cols-12 md:pb-24 md:pt-20">
        <div className="md:col-span-7">
          <h1 id="hero-title" className="text-5xl leading-[1.02] md:text-7xl">
            Yoga, meditação e espaço para voltares a ti.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft md:text-xl">
            Práticas ao vivo, meditações e uma comunidade para cuidares do corpo e viveres com mais presença.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/esta-semana">Experimentar esta semana grátis</ButtonLink>
            <ButtonLink href="/acesso-completo" variant="secondary">
              Descobrir o Open For You
            </ButtonLink>
          </div>
        </div>
        <Photo
          src="/images/hero.jpg"
          alt="Pessoa a praticar Yoga ao ar livre"
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="aspect-[4/5] rounded-bl-[6rem] rounded-br-lg rounded-tl-lg rounded-tr-[6rem] md:col-span-5"
        />
      </section>

      {/* 4.2 Esta semana */}
      <section id="esta-semana" aria-labelledby="week-title" className="bg-paper pb-20">
        <div className="wrap">
          <h2 id="week-title" className="text-4xl md:text-5xl">
            Esta semana no Open For You
          </h2>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">
            Três momentos gratuitos. Uma nova seleção todas as semanas.
          </p>
          <div className="mt-10">
            <WeeklyCards weekly={weekly} />
          </div>
        </div>
      </section>

      {/* 4.3 Três caminhos */}
      <section aria-labelledby="paths-title" className="wrap py-16 md:py-24">
        <h2 id="paths-title" className="max-w-3xl text-4xl leading-tight md:text-5xl">
          Começa pelo corpo. Cria espaço na mente. Leva a prática para a vida.
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
          {PATHS.map((p, i) => (
            <div key={p.name} className={`md:px-8 ${i > 0 ? "md:border-l md:border-ink/15" : "md:pl-0"}`}>
              <h3 className="font-display text-5xl text-moss">{p.name}</h3>
              <p className="mt-3 max-w-xs text-ink-soft">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4.4 Acesso completo */}
      <section aria-label="Acesso completo" className="wrap">
        <Pricing prices={prices} />
      </section>

      {/* 4.5 Comunidade */}
      <section aria-labelledby="community-title" className="wrap grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div>
          <h2 id="community-title" className="text-4xl leading-tight md:text-5xl">
            Praticar é pessoal. Continuar é mais fácil quando não estamos sozinhos.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Partilha reflexões, fotografias e momentos da tua prática numa comunidade privada, próxima e moderada.
          </p>
        </div>
        <ul className="self-center divide-y divide-ink/15 border-y border-ink/15">
          {[
            "Publicar mensagens",
            "Partilhar reflexões",
            "Adicionar fotografias",
            "Comentar e reagir",
            "Participar nos temas semanais",
          ].map((t) => (
            <li key={t} className="py-4 text-lg">
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* 4.6 Livro */}
      <section aria-labelledby="book-title" className="bg-sand py-20">
        <div className="wrap grid items-center gap-12 md:grid-cols-[1fr_1.3fr]">
          <Photo
            src="/images/livro-capa.jpg"
            alt="Capa do livro Quem Sou Eu?"
            sizes="(min-width: 768px) 30vw, 70vw"
            className="mx-auto aspect-[2/3] w-full max-w-xs rounded-md shadow-xl"
          />
          <div>
            <h2 id="book-title" className="text-5xl md:text-6xl">
              Quem Sou Eu?
            </h2>
            <p className="mt-2 font-display text-2xl text-moss">Uma viagem ao coração do Yoga e da consciência.</p>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Um livro para praticantes e para quem nunca colocou os pés num tapete, sobre as perguntas que
              atravessam a experiência humana. A compra direta inclui uma meditação exclusiva.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/livro#excerto" variant="secondary">
                Ler um capítulo grátis
              </ButtonLink>
              <ButtonLink href="/livro#comprar">Comprar o eBook — {formatEUR(prices.ebookCents)}</ButtonLink>
              {SITE.kindleUrl && (
                <ButtonLink href={SITE.kindleUrl} external variant="quiet" className="self-center">
                  Ver no Kindle
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4.7 Quem sou */}
      <section aria-labelledby="about-title" className="wrap grid items-center gap-12 py-20 md:grid-cols-[1fr_1.2fr] md:py-28">
        <Photo
          src="/images/jose-maria.jpg"
          alt="José Maria Garcia"
          sizes="(min-width: 768px) 35vw, 100vw"
          className="aspect-square rounded-tl-[6rem] rounded-br-[6rem] rounded-bl-lg rounded-tr-lg"
        />
        <div>
          <h2 id="about-title" className="text-4xl md:text-5xl">
            Sou José Maria Garcia.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            A minha vida cruza engenharia, liderança, escrita e Yoga. Criei o Open For You para aproximar a prática
            da vida real: menos performance, mais presença, curiosidade e continuidade.
          </p>
          <ButtonLink href="/quem-sou" variant="secondary" className="mt-8">
            Conhecer a minha história
          </ButtonLink>
        </div>
      </section>

      {/* 4.8 Newsletter */}
      <section id="newsletter" aria-labelledby="news-title" className="bg-moss-soft py-20">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h2 id="news-title" className="text-4xl leading-tight md:text-5xl">
              Uma pausa no meio do ruído
            </h2>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              Recebe as práticas gratuitas da semana e, uma vez por mês, uma reflexão do Open For You. Sem mensagens
              constantes. Apenas algo que valha a pena abrir.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {/* 4.9 Encerramento */}
      <section aria-labelledby="close-title" className="wrap py-24 text-center md:py-32">
        <h2 id="close-title" className="mx-auto max-w-3xl text-4xl leading-tight md:text-6xl">
          Não precisas de mudar a tua vida toda. Podes começar por uma prática.
        </h2>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/esta-semana">Experimentar gratuitamente</ButtonLink>
          <ButtonLink href="/acesso-completo" variant="secondary">
            Ter acesso completo
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
