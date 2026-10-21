import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

type Props = {
  /** Caminho dentro de /public, por exemplo "/images/hero.jpg". */
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Mostra a fotografia se o ficheiro existir em /public.
 * Caso contrário mostra um marcador de posição discreto, para o site
 * nunca ficar com imagens partidas enquanto faltam as fotografias reais.
 */
export function Photo({ src, alt, className = "", priority = false, sizes = "(min-width: 768px) 40vw, 100vw" }: Props) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {exists ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #cfdde4 0%, #e6ddcb 55%, #8fa68f 55%, #3f5b45 100%)",
          }}
        >
          {process.env.NODE_ENV !== "production" && (
            <span className="absolute bottom-3 left-3 rounded bg-paper/80 px-2 py-1 text-xs text-ink-soft">
              Fotografia por adicionar: public{src}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
