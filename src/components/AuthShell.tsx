import type { ReactNode } from "react";

type Props = { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode };

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="wrap py-14 md:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-ink-soft">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-sm text-ink-soft">{footer}</div>}
      </div>
    </div>
  );
}
