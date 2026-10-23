/**
 * Endereço público do site: usado nos regressos do Stripe, nos ficheiros de calendário e nos links.
 * Usa NEXT_PUBLIC_SITE_URL se existir; na Vercel usa o domínio de produção; só em desenvolvimento cai em localhost.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export const SITE = {
  name: "Open For You",
  description:
    "Yoga, meditação e espaço para voltares a ti. Práticas ao vivo, meditações e uma comunidade.",
  url: resolveSiteUrl(),
  isProduction: process.env.NEXT_PUBLIC_SITE_ENV === "production",
  kindleUrl: process.env.NEXT_PUBLIC_KINDLE_URL ?? "",
} as const;

export const NAV = [
  { href: "/esta-semana", label: "Esta semana" },
  { href: "/acesso-completo", label: "Acesso completo" },
  { href: "/livro", label: "Livro" },
  { href: "/quem-sou", label: "Quem sou" },
  { href: "/entrar", label: "Entrar" },
] as const;

export const LEGAL = [
  { slug: "privacidade", label: "Privacidade" },
  { slug: "termos", label: "Termos" },
  { slug: "cancelamento", label: "Cancelamento" },
  { slug: "regras-da-comunidade", label: "Regras da comunidade" },
] as const;
