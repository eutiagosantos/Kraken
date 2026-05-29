type AuthError = { message?: string; code?: string } | null;

function errorCode(error: AuthError): string {
  return (error?.code ?? "").trim();
}

function errorMessage(error: AuthError): string {
  return (error?.message ?? "").trim();
}

function matches(error: AuthError, code: string, ...substrings: string[]): boolean {
  const c = errorCode(error).toLowerCase();
  const m = errorMessage(error).toLowerCase();
  if (c === code.toLowerCase()) return true;
  return substrings.some((s) => m.includes(s.toLowerCase()));
}

export function isEmailNotConfirmedError(error: AuthError): boolean {
  return matches(error, "email_not_confirmed", "email not confirmed");
}

/** User-facing copy for Supabase Auth errors on sign-up (PT). */
export function messageForSignUpAuthError(error: AuthError): string {
  if (!error) return "Ocorreu um erro. Tenta novamente.";
  const msg = errorMessage(error);

  if (
    matches(error, "over_email_send_rate_limit", "over_email_send_rate_limit", "email rate limit")
  ) {
    return (
      "O limite de envio de e-mails deste projeto foi atingido. " +
      "Espera cerca de uma hora e tenta reenviar, ou configura SMTP próprio no Supabase " +
      "(Authentication → Emails) para quotas maiores."
    );
  }

  if (matches(error, "user_already_registered", "user already registered", "already been registered")) {
    return "Este e-mail já está registado. Tenta entrar ou reenvia o e-mail de confirmação.";
  }

  return msg || "Ocorreu um erro. Tenta novamente.";
}

/** User-facing copy for Supabase Auth errors on sign-in (PT). */
export function messageForSignInAuthError(error: AuthError): string {
  if (!error) return "Ocorreu um erro. Tenta novamente.";
  const msg = errorMessage(error);

  if (isEmailNotConfirmedError(error)) {
    return "Confirme o seu e-mail antes de entrar. Verifique a caixa de entrada (e spam) ou reenvie o link abaixo.";
  }

  if (matches(error, "invalid_credentials", "invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (
    matches(error, "over_email_send_rate_limit", "over_email_send_rate_limit", "email rate limit")
  ) {
    return "Limite de envio de e-mails atingido. Espera cerca de uma hora e tenta novamente.";
  }

  return msg || "Ocorreu um erro. Tenta novamente.";
}
