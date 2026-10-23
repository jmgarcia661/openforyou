import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Início" },
  { href: "/admin/conteudos", label: "Conteúdos" },
  { href: "/admin/semana", label: "Semana grátis" },
  { href: "/", label: "Ver o site" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="wrap py-10">
      <div className="grid gap-10 md:grid-cols-[13rem_1fr]">
        <nav aria-label="Administração" className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-1">
          <p className="mb-2 hidden font-display text-2xl md:block">Administração</p>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2 hover:bg-sand">
              {l.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
