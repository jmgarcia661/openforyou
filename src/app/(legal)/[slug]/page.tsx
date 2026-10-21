import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEGAL.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL.find((l) => l.slug === slug);
  return { title: page?.label ?? "Informação legal" };
}

// Placeholder. Os textos finais têm de ser revistos por um jurista antes do lançamento.
export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = LEGAL.find((l) => l.slug === slug);
  if (!page) return notFound();

  return (
    <div className="wrap max-w-3xl py-16">
      <h1 className="text-5xl">{page.label}</h1>
      <p className="mt-6 text-lg text-ink-soft">Este texto está em preparação e será publicado antes do lançamento.</p>
    </div>
  );
}
