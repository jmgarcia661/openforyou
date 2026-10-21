import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";
import { WeeklyCards } from "@/components/WeeklyCards";
import { getWeeklyFree } from "@/lib/weekly";

export const metadata: Metadata = { title: "Esta semana" };
export const revalidate = 300;

export default async function EstaSemanaPage() {
  const weekly = await getWeeklyFree();

  return (
    <>
      <section className="wrap pb-12 pt-14 md:pt-20">
        <h1 className="text-5xl md:text-6xl">Esta semana no Open For You</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          Três momentos gratuitos, sem formulários e sem conta. Uma nova seleção todas as semanas.
        </p>
        {weekly.theme && (
          <p className="mt-6 font-display text-2xl text-moss">Tema da semana: {weekly.theme}</p>
        )}
        {weekly.reflection && <p className="mt-2 max-w-xl text-ink-soft">{weekly.reflection}</p>}
      </section>

      <section aria-label="Práticas gratuitas" className="wrap">
        <WeeklyCards weekly={weekly} />
      </section>

      <section id="newsletter" className="mt-20 bg-moss-soft py-16">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-tight">Recebe as próximas práticas</h2>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Uma mensagem por semana com a nova seleção gratuita. Cancelas quando quiseres.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
