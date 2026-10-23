"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

/** Mostra "Entrar" ou "Praticar" e "A minha conta", sem tornar as páginas públicas dinâmicas. */
export function AuthLink({ className = "" }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!signedIn) {
    return (
      <Link href="/entrar" className={className}>
        Entrar
      </Link>
    );
  }

  return (
    <>
      <Link href="/praticar" className={className}>
        Praticar
      </Link>
      <Link href="/conta" className={className}>
        A minha conta
      </Link>
    </>
  );
}
