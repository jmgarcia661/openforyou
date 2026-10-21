import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { DeleteAccount } from "@/components/auth/DeleteAccount";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "A minha conta" };
export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    return (
      <div className="wrap py-20">
        <h1 className="text-4xl">A minha conta</h1>
        <p className="mt-4 text-ink-soft">A área de conta ainda não está disponível.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/conta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, timezone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="wrap max-w-2xl py-14 md:py-20">
      <h1 className="text-4xl md:text-5xl">A minha conta</h1>

      <section aria-labelledby="sub-title" className="mt-12">
        <h2 id="sub-title" className="text-2xl">
          Subscrição
        </h2>
        <p className="mt-2 text-ink-soft">Ainda não tens acesso completo.</p>
        <ButtonLink href="/acesso-completo" variant="secondary" className="mt-4">
          Ver o acesso completo
        </ButtonLink>
      </section>

      <section aria-labelledby="profile-title" className="mt-12 border-t border-ink/15 pt-10">
        <h2 id="profile-title" className="mb-6 text-2xl">
          Perfil
        </h2>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          name={profile?.full_name ?? ""}
          timezone={profile?.timezone ?? "Europe/Lisbon"}
        />
      </section>

      <section aria-labelledby="pw-title" className="mt-12 border-t border-ink/15 pt-10">
        <h2 id="pw-title" className="mb-6 text-2xl">
          Palavra-passe
        </h2>
        <NewPasswordForm />
      </section>

      <section aria-labelledby="data-title" className="mt-12 border-t border-ink/15 pt-10">
        <h2 id="data-title" className="text-2xl">
          Os teus dados
        </h2>
        <p className="mt-2 text-ink-soft">Descarrega uma cópia dos dados que guardamos sobre ti.</p>
        <a
          href="/api/conta/exportar"
          className="mt-4 inline-flex h-12 items-center rounded-full border border-ink/30 px-6 font-medium transition-colors hover:border-ink hover:bg-ink/5"
        >
          Descarregar os meus dados
        </a>
      </section>

      <section aria-labelledby="del-title" className="mt-12 border-t border-ink/15 pt-10">
        <h2 id="del-title" className="mb-4 text-2xl">
          Eliminar conta
        </h2>
        <DeleteAccount />
      </section>

      <div className="mt-12 border-t border-ink/15 pt-10">
        <SignOutButton />
      </div>
    </div>
  );
}
