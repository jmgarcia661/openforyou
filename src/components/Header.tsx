import Link from "next/link";
import { ButtonLink } from "./ButtonLink";
import { NavLinks } from "./NavLinks";
import { HideForMembers } from "./ViewerGate";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Open For You
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 text-[0.95rem] md:flex">
          <NavLinks variant="desktop" />
        </nav>

        <div className="flex items-center gap-3">
          <HideForMembers>
            <ButtonLink href="/esta-semana" size="sm" className="hidden sm:inline-flex">
              Experimentar grátis
            </ButtonLink>
          </HideForMembers>

          {/* Menu móvel sem JavaScript: elemento <details> nativo */}
          <details className="relative md:hidden">
            <summary className="flex h-10 cursor-pointer list-none items-center rounded-full border border-ink/30 px-4 text-sm [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Principal"
              className="absolute right-0 mt-2 flex w-60 flex-col gap-1 rounded-2xl border border-ink/10 bg-paper p-2 shadow-lg"
            >
              <NavLinks variant="mobile" />
              <HideForMembers>
                <Link href="/esta-semana" className="mt-1 block rounded-xl bg-clay px-4 py-3 text-white">
                  Experimentar grátis
                </Link>
              </HideForMembers>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
