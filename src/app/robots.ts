import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Staging e previews nunca devem aparecer em motores de pesquisa.
export default function robots(): MetadataRoute.Robots {
  if (!SITE.isProduction) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/conta", "/praticar", "/calendario", "/aulas", "/comunidade", "/api/"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
