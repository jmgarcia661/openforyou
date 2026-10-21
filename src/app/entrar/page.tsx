import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";

export const metadata: Metadata = { title: "Entrar" };

// Placeholder. O registo, o login e o checkout chegam nas Fases 2 e 3.
export default function EntrarPage() {
  return (
    <div className="wrap py-24 text-center">
      <h1 className="text-5xl">Entrar</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        O registo e o início de sessão abrem em breve. Entretanto, experimenta as práticas gratuitas desta semana.
      </p>
      <ButtonLink href="/esta-semana" className="mt-8">
        Ver esta semana
      </ButtonLink>
    </div>
  );
}
