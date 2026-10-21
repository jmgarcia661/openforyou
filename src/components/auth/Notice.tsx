import type { ReactNode } from "react";

export function Notice({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const tone = kind === "error" ? "bg-clay/10 text-clay-dark" : "bg-moss-soft text-moss";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${tone}`}>
      {children}
    </p>
  );
}
