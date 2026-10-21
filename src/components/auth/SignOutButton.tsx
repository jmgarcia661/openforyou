"use client";

import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await getBrowserClient()?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-12 items-center rounded-full border border-ink/30 px-6 font-medium transition-colors hover:border-ink hover:bg-ink/5"
    >
      Terminar sessão
    </button>
  );
}
