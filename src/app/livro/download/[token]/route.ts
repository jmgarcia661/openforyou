import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

// Cada download é contado na base de dados. O ficheiro nunca é público:
// a pessoa é encaminhada para um link que dura apenas um minuto.
export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const back = (query = "") => NextResponse.redirect(new URL(`/livro/acesso/${token}${query}`, request.url));

  if (!/^[a-f0-9]{48}$/.test(token)) return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Indisponível." }, { status: 503 });

  const { data: path } = await admin.rpc("claim_ebook_download", { p_token: token });
  if (!path || typeof path !== "string") return back("?erro=download");

  const { data: file } = await admin.from("book_files").select("file_name").eq("id", 1).maybeSingle();
  const { data: signed } = await admin.storage
    .from("ebook")
    .createSignedUrl(path, 60, { download: (file?.file_name as string | null) ?? true });
  if (!signed?.signedUrl) return back("?erro=download");

  return NextResponse.redirect(signed.signedUrl);
}
