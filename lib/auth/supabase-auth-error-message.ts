/** User-facing copy for Supabase Auth errors on sign-up (PT). */
export function messageForSignUpAuthError(error: { message?: string; code?: string } | null): string {
  if (!error) return "Ocorreu um erro. Tenta novamente.";
  const code = (error.code ?? "").trim();
  const msg = (error.message ?? "").trim();
  if (
    code === "over_email_send_rate_limit" ||
    msg.toLowerCase().includes("over_email_send_rate_limit") ||
    msg.toLowerCase().includes("email rate limit")
  ) {
    return (
      "O limite de envio de e-mails deste projeto foi atingido (confirmação de conta). " +
      "Espera cerca de uma hora e tenta de novo, ou regista-te com Meta abaixo. " +
      "Em produção, configura SMTP próprio no Supabase (Authentication → Emails) para quotas maiores."
    );
  }
  return msg || "Ocorreu um erro. Tenta novamente.";
}
