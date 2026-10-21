"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContentKind } from "@/lib/weekly";

type Props = {
  kind: ContentKind;
  title: string;
  src: string | null;
  label: string;
};

export function MediaPlayer({ kind, title, src, label }: Props) {
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!src) {
    return (
      <p className="text-sm text-ink-soft">
        Esta prática fica disponível assim que o ficheiro for carregado.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-paper transition-colors hover:bg-clay"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {kind === "yoga" ? (
        <video
          className="aspect-video w-full rounded-2xl bg-ink"
          controls
          autoPlay
          playsInline
          controlsList="nodownload"
          aria-label={title}
          src={src}
          onEnded={() => setFinished(true)}
        />
      ) : (
        <audio
          className="w-full"
          controls
          autoPlay
          preload="none"
          controlsList="nodownload"
          aria-label={title}
          src={src}
          onEnded={() => setFinished(true)}
        />
      )}

      {finished && (
        <p className="rounded-2xl bg-paper/70 p-4 text-sm" role="status">
          Gostaste? Recebe as próximas práticas por email ou{" "}
          <Link href="/entrar" className="underline underline-offset-4">
            cria uma conta gratuita
          </Link>
          . Sem pressa.
        </p>
      )}
    </div>
  );
}
