import { ButtonLink } from "./ButtonLink";

export function MembersOnly({ title }: { title: string }) {
  return (
    <div className="wrap max-w-2xl py-20 text-center">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        Com o acesso completo tens as aulas em direto, o calendário, toda a biblioteca e a comunidade.
      </p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/acesso-completo">Ver o acesso completo</ButtonLink>
      </div>
    </div>
  );
}
