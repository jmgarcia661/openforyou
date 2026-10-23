"use client";

import type { ReactNode } from "react";
import { useViewer } from "./ViewerProvider";

/** Esconde o conteúdo a administradores e membros (por exemplo, botões de compra). */
export function HideForMembers({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  return viewer.isAdmin || viewer.isMember ? null : <>{children}</>;
}

/** Mostra o conteúdo só a administradores e membros. */
export function ShowForMembers({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  return viewer.isAdmin || viewer.isMember ? <>{children}</> : null;
}
