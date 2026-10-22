import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Só corre onde é preciso, para as páginas públicas continuarem estáticas e rápidas.
export const config = {
  matcher: [
    "/conta/:path*",
    "/api/conta/:path*",
    "/subscrever",
    "/bem-vindo",
    "/api/stripe/checkout",
    "/api/stripe/portal",
  ],
};
