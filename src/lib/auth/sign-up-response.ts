type SignUpUser = { identities?: unknown[] } | null;

/** Supabase returns an obfuscated user with empty identities when email already exists (confirm email on). */
export function isDuplicateSignUpResponse(user: SignUpUser): boolean {
  return Boolean(user && user.identities?.length === 0);
}

export const DUPLICATE_SIGN_UP_MESSAGE =
  "Este e-mail já está registado. Tenta entrar com a sua senha.";
