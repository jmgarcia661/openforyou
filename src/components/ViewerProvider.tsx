"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

export type Viewer = { signedIn: boolean; isAdmin: boolean; isMember: boolean };

const EMPTY: Viewer = { signedIn: false, isAdmin: false, isMember: false };
const ViewerContext = createContext<Viewer>(EMPTY);

export function useViewer(): Viewer {
  return useContext(ViewerContext);
}

/**
 * Descobre, no navegador, se há sessão, se a pessoa é administradora e se é membro.
 * Serve só para mostrar ou esconder botões. O acesso a sério é sempre decidido no servidor.
 */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<Viewer>(EMPTY);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let active = true;

    const load = async (signedIn: boolean) => {
      if (!signedIn) {
        if (active) setViewer(EMPTY);
        return;
      }
      const [admin, member] = await Promise.all([
        supabase.rpc("is_admin"),
        supabase.rpc("has_active_subscription"),
      ]);
      if (active) {
        setViewer({ signedIn: true, isAdmin: admin.data === true, isMember: member.data === true });
      }
    };

    supabase.auth.getSession().then(({ data }) => load(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Fora do callback, para não bloquear o Supabase.
      setTimeout(() => void load(Boolean(session)), 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}
