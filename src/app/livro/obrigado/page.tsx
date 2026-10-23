import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ButtonLink } from "@/components/ButtonLink";
import { fulfillEbookSession } from "@/lib/book";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Obrigado" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string }> };

function Message({ title, text, refresh = false }: { title: string; text: string; refresh?: boolean }) {
  return (
    <div className="wrap max-w-2xl py-20 text-center">
      {refresh && <AutoRefresh />}
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">{text}</p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/livro" variant="secondary">
          Voltar ao livro
        </ButtonLink>
      </div>
    </div>
  );
}

export default async function ObrigadoPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();
  const admin = getAdminClient();

  if (!sessionId || !stripe || !admin) {
    return <Message title="Não encontrámos a tua compra" text="Se acabaste de pagar, o Stripe enviou-te um recibo por email. Escreve-nos e ajudamos." />;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return <Message title="Não encontrámos a tua compra" text="Se acabaste de pagar, o Stripe enviou-te um recibo por email. Escreve-nos e ajudamos." />;
  }

  if (session.payment_status !== "paid") {
    return <Message refresh title="A confirmar o teu pagamento" text="Demora só alguns segundos. Esta página atualiza sozinha." />;
  }

  const token = await fulfillEbookSession(admin, session);
  if (!token) {
    return <Message title="Esta compra não é do eBook" text="Se tens dúvidas, escreve-nos e ajudamos." />;
  }

  redirect(`/livro/acesso/${token}`);
}
