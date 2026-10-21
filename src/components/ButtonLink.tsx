import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-clay text-white hover:bg-clay-dark",
  secondary: "border border-ink/30 text-ink hover:border-ink hover:bg-ink/5",
  quiet: "text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
};

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  external?: boolean;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  className = "",
}: Props) {
  const cls = `${base} ${variants[variant]} ${variant === "quiet" ? "" : sizes[size]} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
