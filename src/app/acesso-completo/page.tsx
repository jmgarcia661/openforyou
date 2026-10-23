import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { Pricing } from "@/components/Pricing";
import { HideForMembers, ShowForMembers } from "@/components/ViewerGate";
import { formatEUR, getPrices } from "@/lib/pricing";

export const metadata: Metadata = { title: "Acesso completo" };
export const revalidate = 300;

export default async function AcessoCompletoPage() {
  const prices = await getPrices();
  const monthly = formatEUR(prices.monthlyCents);

  return (
    <div className="wrap py-14 md:py-20">
      <ShowForMembers>
        <div className="mx-auto max-w-xl py-10 text-center">
          <h1 className="text-4xl md:text-5xl">Já tens acesso completo</h1>
          <p className="mt-4 text-lg text-ink-soft">Tens toda a biblioteca disponível.</p>
          <ButtonLink href="/praticar" className="mt-8">
            Ir para a biblioteca
          </ButtonLink>
        </div>
      </ShowForMembers>

      <HideForMembers>
        <Pricing prices={prices} />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
          A subscrição renova-se automaticamente por {monthly}/mês e pode ser cancelada a qualquer momento.
          Depois do cancelamento, o acesso mantém-se até ao fim do período já pago.
        </p>
      </HideForMembers>
    </div>
  );
}
