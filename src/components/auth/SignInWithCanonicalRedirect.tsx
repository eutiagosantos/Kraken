"use client";

import { SignIn } from "@clerk/nextjs";

import { clerkForceRedirectAfterSignIn } from "@/components/auth/clerk-auth-redirect-urls";

export function SignInWithCanonicalRedirect() {
  return (
    <SignIn
      routing="path"
      path="/login"
      signUpUrl="/cadastro"
      forceRedirectUrl={clerkForceRedirectAfterSignIn()}
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none border-0 p-0 gap-4",
          headerTitle: "hidden",
          headerSubtitle: "hidden",
          footer: "hidden",
        },
      }}
    />
  );
}
