import Image from "next/image";
import Link from "next/link";
import { KIND_SINGULAR, metaLine, type ContentRow } from "@/lib/content";

type Props = { item: ContentRow; cover: string | null };

export function ContentCard({ item, cover }: Props) {
  return (
    <Link href={`/praticar/${item.id}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-b from-sky to-moss-soft p-4">
            <span className="text-sm text-ink-soft">{KIND_SINGULAR[item.kind]}</span>
          </div>
        )}
      </div>
      <h3 className="mt-3 font-display text-2xl leading-tight">{item.title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{metaLine(item)}</p>
    </Link>
  );
}
