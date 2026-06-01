export type ClerkEnvIssue =
  | "missing_publishable_key"
  | "missing_secret_key"
  | "test_keys_in_production"
  | "missing_sign_in_url"
  | "missing_sign_up_url";

export type ClerkEnvCheck = {
  ok: boolean;
  issues: ClerkEnvIssue[];
  publishableKeyPrefix: string | null;
  signInUrl: string | null;
  signUpUrl: string | null;
};

const isProductionRuntime =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

function keyPrefix(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("pk_live_")) return "pk_live_";
  if (trimmed.startsWith("pk_test_")) return "pk_test_";
  return trimmed.slice(0, 8);
}

/** Validates Clerk env for middleware; safe to expose via /api/health/clerk (no secrets). */
export function checkClerkEnv(options?: { production?: boolean }): ClerkEnvCheck {
  const production = options?.production ?? isProductionRuntime;
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const secret = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() ?? "";
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() ?? "";

  const issues: ClerkEnvIssue[] = [];

  if (!publishable) issues.push("missing_publishable_key");
  if (!secret) issues.push("missing_secret_key");
  if (production && (publishable.startsWith("pk_test_") || secret.startsWith("sk_test_"))) {
    issues.push("test_keys_in_production");
  }
  if (!signInUrl) issues.push("missing_sign_in_url");
  if (!signUpUrl) issues.push("missing_sign_up_url");

  return {
    ok: issues.length === 0,
    issues,
    publishableKeyPrefix: keyPrefix(publishable),
    signInUrl: signInUrl || null,
    signUpUrl: signUpUrl || null,
  };
}
