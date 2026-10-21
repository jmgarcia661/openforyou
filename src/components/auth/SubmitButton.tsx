import type { ReactNode } from "react";

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-dark disabled:opacity-60"
    >
      {children}
    </button>
  );
}
