"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  if (ms <= 0) return "A começar";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days} d ${pad(hours)} h ${pad(minutes)} min`;
  if (hours > 0) return `${hours} h ${pad(minutes)} min`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{format(new Date(target).getTime() - now)}</span>;
}
