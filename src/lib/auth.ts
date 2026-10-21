/** Aceita apenas caminhos internos, para impedir redirecionamentos para sites externos. */
export function safeNext(value: string | null | undefined, fallback = "/conta"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

/** Traduz erros do Supabase para mensagens claras, sem revelar detalhes técnicos. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirma o teu email antes de entrar. Procura a mensagem na tua caixa de entrada.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiadas tentativas. Espera alguns minutos e tenta novamente.";
  if (m.includes("different from the old") || m.includes("same password"))
    return "A nova palavra-passe tem de ser diferente da atual.";
  if (m.includes("weak") || m.includes("password should"))
    return "Escolhe uma palavra-passe mais forte.";
  return "Não foi possível concluir o pedido. Tenta novamente.";
}
