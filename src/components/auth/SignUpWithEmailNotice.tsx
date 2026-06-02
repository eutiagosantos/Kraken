"use client";

import { SignUp, useSignUp } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import { clerkForceRedirectAfterSignUp } from "@/components/auth/clerk-auth-redirect-urls";
import { cn } from "@/libs/utils";

function isAwaitingEmailVerification(signUp: ReturnType<typeof useSignUp>["signUp"]) {
  return (
    signUp?.status === "missing_requirements" &&
    signUp.verifications.emailAddress.status === "unverified"
  );
}

export function SignUpWithEmailNotice() {
  const { signUp } = useSignUp();
  const showEmailNotice = isAwaitingEmailVerification(signUp);
  const email = signUp?.emailAddress;

  return (
    <div className="space-y-4">
      {showEmailNotice ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm",
            "border-neutral-border bg-brand-purple-subtle text-brand-purple-deep"
          )}
          role="status"
        >
          <div className="flex items-start gap-2.5">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold text-brand-purple-deep">Verifique seu e-mail</p>
              <p className="mt-1 leading-relaxed">
                Enviamos um código para{" "}
                {email ? (
                  <strong className="font-semibold text-brand-purple-deep">{email}</strong>
                ) : (
                  "seu e-mail"
                )}
                . Acesse sua caixa de entrada e insira o código abaixo para ativar sua conta.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <SignUp
        routing="path"
        path="/cadastro"
        signInUrl="/login"
        forceRedirectUrl={clerkForceRedirectAfterSignUp()}
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
    </div>
  );
}
