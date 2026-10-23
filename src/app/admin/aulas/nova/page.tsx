import type { Metadata } from "next";
import { LiveEventForm } from "@/components/admin/LiveEventForm";

export const metadata: Metadata = { title: "Nova aula" };

export default function NovaAulaPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl md:text-5xl">Nova aula em direto</h1>
      <LiveEventForm />
    </div>
  );
}
