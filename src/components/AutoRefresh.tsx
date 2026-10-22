"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Volta a pedir a página algumas vezes, enquanto esperamos que o pagamento seja confirmado. */
export function AutoRefresh({ everyMs = 3000, maxTimes = 10 }: { everyMs?: number; maxTimes?: number }) {
  const router = useRouter();

  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= maxTimes) clearInterval(id);
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, maxTimes]);

  return null;
}
