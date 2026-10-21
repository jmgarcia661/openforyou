import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/esta-semana", "/acesso-completo", "/livro", "/quem-sou"].map((p) => ({
    url: `${SITE.url}${p}`,
  }));
}
