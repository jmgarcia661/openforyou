export const SITE = {
  name: "Open For You",
  description:
    "Yoga, meditação e espaço para voltares a ti. Práticas ao vivo, meditações e uma comunidade.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
