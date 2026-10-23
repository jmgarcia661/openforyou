"use client";

import Link from "next/link";
import { NAV } from "@/lib/site";
import { useViewer } from "./ViewerProvider";

type Props = { variant: "desktop" | "mobile" };

export function NavLinks({ variant }: Props) {
  const viewer = useViewer();
  const hasAccess = viewer.isAdmin || viewer.isMember;

  const base = variant === "desktop" ? "underline-offset-4 hover:underline" : "rounded-xl px-4 py-3 hover:bg-sand";
  const adminClass =
    variant === "desktop"
      ? "rounded-full bg-moss px-4 py-1.5 text-paper transition-colors hover:bg-ink"
      : "rounded-xl bg-moss px-4 py-3 text-paper";

  const items = NAV.filter((item) => item.href !== "/entrar" && !(hasAccess && item.href === "/acesso-completo"));

  return (
    <>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={base}>
          {item.label}
        </Link>
      ))}
      {viewer.signedIn ? (
        <>
          <Link href="/praticar" className={base}>
            Praticar
          </Link>
          <Link href="/calendario" className={base}>
            Calendário
          </Link>
          <Link href="/conta" className={base}>
            A minha conta
          </Link>
          {viewer.isAdmin && (
            <Link href="/admin" className={adminClass}>
              Administração
            </Link>
          )}
        </>
      ) : (
        <Link href="/entrar" className={base}>
          Entrar
        </Link>
      )}
    </>
  );
}
