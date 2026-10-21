import type { Metadata } from "next";
import { Pricing } from "@/components/Pricing";
import { formatEUR, getPrices } from "@/lib/pricing";

export const metadata: Metadata = { title: "Acesso completo" };
export const revalidate = 300;

export default async function AcessoCompletoPage() {
  const prices = await getPrices();
  const monthly = formatEUR(prices.monthlyCents);

  return (
    <div className="wrap py-14 md:py-20">
      <Pricing prices={prices} />
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
        A subscrição renova-se automaticamente por {monthly}/mês e pode ser cancelada a qualquer momento.
        Depois do cancelamento, o acesso mantém-se até ao fim do período já pago.
      </p>
    </div>
  );
}
