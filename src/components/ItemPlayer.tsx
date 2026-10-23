import type { ContentKind } from "@/lib/content";

type Props = { kind: ContentKind; title: string; src: string };

export function ItemPlayer({ kind, title, src }: Props) {
  if (kind === "yoga") {
    return (
      <video
        className="aspect-video w-full rounded-2xl bg-ink"
        controls
        playsInline
        controlsList="nodownload"
        aria-label={title}
        src={src}
      />
    );
  }
  return <audio className="w-full" controls preload="none" controlsList="nodownload" aria-label={title} src={src} />;
}
