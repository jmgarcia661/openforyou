import Link from "next/link";
import { LEGAL, NAV } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl">Open For You</p>
          <p className="mt-3 max-w-xs text-paper/70">
            Entra como estás. Começa pelo corpo. Cria espaço. Continua acompanhado.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2 text-paper/80">
          {NAV.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-paper">
              {i.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Informação legal" className="flex flex-col gap-2 text-paper/80">
          {LEGAL.map((i) => (
            <Link key={i.slug} href={`/${i.slug}`} className="hover:text-paper">
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-paper/15">
        <p className="wrap py-5 text-sm text-paper/60">
          © {new Date().getFullYear()} Open For You
        </p>
      </div>
    </footer>
  );
}
