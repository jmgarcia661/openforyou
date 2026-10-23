import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const RULES = [
  "Esta é uma comunidade privada, só para membros. O que é partilhado aqui fica aqui: não copies, não partilhes fora e não tires capturas de ecrã para outras pessoas.",
  "Trata toda a gente com respeito e curiosidade. Não há lugar para insultos, discriminação, assédio ou pressão.",
  "Partilha a tua experiência, não conselhos médicos. Se tens uma condição de saúde, fala com um profissional.",
  "Só publicas fotografias tuas ou de pessoas que te deram autorização. Nunca partilhes fotografias de crianças ou de pessoas sem o seu consentimento.",
  "Sem publicidade, vendas ou promoção de outros serviços.",
  "Podes denunciar qualquer publicação ou comentário. O administrador analisa, e pode retirar conteúdo, suspender ou bloquear quem não cumpra estas regras.",
  "Podes editar ou eliminar as tuas publicações a qualquer momento.",
];

export function generateStaticParams() {
  return LEGAL.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL.find((l) => l.slug === slug);
  return { title: page?.label ?? "Informação legal" };
}

// Os restantes textos legais são marcadores. Têm de ser escritos e revistos por um jurista antes do lançamento.
export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = LEGAL.find((l) => l.slug === slug);
  if (!page) return notFound();

  return (
    <div className="wrap max-w-3xl py-16">
      <h1 className="text-5xl">{page.label}</h1>
      {slug === "regras-da-comunidade" ? (
        <>
          <ol className="mt-8 list-decimal space-y-4 pl-6 text-lg">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-ink-soft">Rascunho para rever antes do lançamento.</p>
        </>
      ) : (
        <p className="mt-6 text-lg text-ink-soft">Este texto está em preparação e será publicado antes do lançamento.</p>
      )}
    </div>
  );
}
