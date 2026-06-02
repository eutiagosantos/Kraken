import { buildCanonicalAppUrl } from "@/libs/auth/canonical-app-origin";

export function clerkForceRedirectAfterSignIn(): string {
  const path = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?.trim() || "/home";
  return buildCanonicalAppUrl(path);
}

export function clerkForceRedirectAfterSignUp(): string {
  return buildCanonicalAppUrl("/onboarding");
}
