import Image from "next/image";
import type { ContentItem, WeeklyFree } from "@/lib/weekly";
import { MediaPlayer } from "./MediaPlayer";

type TileProps = {
  heading: string;
  buttonLabel: string;
  item: ContentItem | null;
  tone: string;
};

function Tile({ heading, buttonLabel, item, tone }: TileProps) {
  return (
    <article className={`flex flex-col rounded-3xl p-6 md:p-8 ${tone}`}>
      {item?.coverUrl && (
        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-2xl">
          <Image src={item.coverUrl} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        </div>
      )}
      <h3 className="text-base font-sans font-medium opacity-80">{heading}</h3>
      {item ? (
        <>
          <p className="mt-2 font-display text-3xl leading-tight md:text-4xl">{item.title}</p>
          {item.durationMin && <p className="mt-2 opacity-80">{item.durationMin} minutos</p>}
          {item.description && <p className="mt-3 opacity-90">{item.description}</p>}
          <div className="mt-8">
            <MediaPlayer kind={item.kind} title={item.title} src={item.mediaUrl} label={buttonLabel} />
          </div>
        </>
      ) : (
        <p className="mt-2 opacity-80">A nova seleção chega em breve.</p>
      )}
    </article>
  );
}

export function WeeklyCards({ weekly }: { weekly: WeeklyFree }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
      <Tile heading="Aula da semana" buttonLabel="Começar a aula" item={weekly.yoga} tone="bg-sand" />
      <Tile heading="Meditação da semana" buttonLabel="Ouvir meditação" item={weekly.meditation} tone="bg-sky" />
      <Tile heading="Som da semana" buttonLabel="Ouvir agora" item={weekly.sound} tone="bg-moss-soft" />
    </div>
  );
}
