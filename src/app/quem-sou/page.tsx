import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = { title: "Quem sou" };

export default function QuemSouPage() {
  return (
    <div className="wrap grid items-center gap-12 py-14 md:grid-cols-[1fr_1.2fr] md:py-20">
      <Photo
        src="/images/jose-maria.jpg"
        alt="José Maria Garcia"
        sizes="(min-width: 768px) 35vw, 100vw"
        className="aspect-square rounded-bl-lg rounded-br-[6rem] rounded-tl-[6rem] rounded-tr-lg"
      />
      <div>
        <h1 className="text-5xl md:text-6xl">Sou José Maria Garcia.</h1>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          A minha vida cruza engenharia, liderança, escrita e Yoga. Criei o Open For You para aproximar a prática da
          vida real: menos performance, mais presença, curiosidade e continuidade.
        </p>
        <ButtonLink href="/esta-semana" className="mt-8">
          Experimentar esta semana grátis
        </ButtonLink>
      </div>
    </div>
  );
}
