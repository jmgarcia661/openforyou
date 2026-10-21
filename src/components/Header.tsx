import Link from "next/link";
import { NAV } from "@/lib/site";
import { AuthLink } from "./AuthLink";
import { ButtonLink } from "./ButtonLink";

const PUBLIC_NAV = NAV.filter((item) => item.href !== "/entrar");

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Open For You
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 text-[0.95rem] md:flex">
          {PUBLIC_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
          <AuthLink className="underline-offset-4 hover:underline" />
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href="/esta-semana" size="sm" className="hidden sm:inline-flex">
            Experimentar grátis
          </ButtonLink>

          {/* Menu móvel sem JavaScript: elemento <details> nativo */}
          <details className="relative md:hidden">
            <summary className="flex h-10 cursor-pointer list-none items-center rounded-full border border-ink/30 px-4 text-sm [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Principal"
              className="absolute right-0 mt-2 flex w-60 flex-col rounded-2xl border border-ink/10 bg-paper p-2 shadow-lg"
            >
              {PUBLIC_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 hover:bg-sand">
                  {item.label}
                </Link>
              ))}
              <AuthLink className="rounded-xl px-4 py-3 hover:bg-sand" />
              <Link href="/esta-semana" className="mt-1 rounded-xl bg-clay px-4 py-3 text-white">
                Experimentar grátis
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
