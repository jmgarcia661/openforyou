import { formatEUR, type Prices } from "@/lib/pricing";
import { ButtonLink } from "./ButtonLink";

const INCLUDES = [
  "Duas aulas de Yoga em direto por semana",
  "Participação ilimitada",
  "Sala de espera para as aulas",
  "Acesso às gravações",
  "Biblioteca de aulas de Yoga",
  "Biblioteca de meditações",
  "Biblioteca de sons",
  "Calendário",
  "Reflexões e propostas semanais",
  "Comunidade privada e moderada",
  "Favoritos",
  "Condições especiais em workshops e retiros",
  "Cancelamento a qualquer momento",
];

export function Pricing({ prices }: { prices: Prices }) {
  const monthly = formatEUR(prices.monthlyCents);
  const first = formatEUR(prices.firstMonthCents);

  return (
    <div className="grid gap-10 rounded-[2rem] bg-moss p-8 text-paper md:grid-cols-2 md:p-12">
      <div>
        <h2 className="text-4xl leading-tight md:text-5xl">Uma prática que continua contigo</h2>
        <p className="mt-4 max-w-md text-lg text-paper/85">
          Duas práticas ao vivo por semana, todas as gravações, meditações, sons e uma comunidade
          para te ajudar a continuar.
        </p>

        <div className="mt-10">
          <p className="text-paper/70">
            <s>{monthly}</s>
          </p>
          <p className="font-display text-5xl">Primeiro mês: {first}</p>
          <p className="mt-1 text-lg">Depois, {monthly}/mês.</p>
        </div>

        <div className="mt-8">
          <ButtonLink href="/subscrever" className="bg-paper !text-ink hover:!bg-sand">
            Começar o primeiro mês
          </ButtonLink>
          <p className="mt-3 text-sm text-paper/80">
            Renovação automática por {monthly}/mês. Cancela quando quiseres.
          </p>
        </div>
      </div>

      <ul className="space-y-3 self-center">
        {INCLUDES.map((line) => (
          <li key={line} className="flex gap-3 border-b border-paper/15 pb-3">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1 size-4 shrink-0 fill-none stroke-current" strokeWidth="2">
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
