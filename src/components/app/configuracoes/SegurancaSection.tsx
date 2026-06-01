"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useKrakenUser } from "@/libs/hooks/useKrakenUser";

function ChangePasswordCard() {
  const { openUserProfile } = useClerk();

  return (
    <div className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h3 className="font-display text-base font-bold tracking-tight text-neutral-black">
          Alterar senha
        </h3>
        <p className="mt-0.5 text-sm text-neutral-silver">
          A gestão de senha é feita pela sua conta Kraken (Clerk).
        </p>
      </header>
      <Button type="button" variant="secondary" onClick={() => openUserProfile()}>
        Abrir gestão de conta
      </Button>
    </div>
  );
}

function SignOutEverywhereCard() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { email } = useKrakenUser();

  const onSignOut = async () => {
    await signOut({ redirectUrl: "/login" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h3 className="font-display text-base font-bold tracking-tight text-neutral-black">
          Sessões
        </h3>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Encerre a sessão neste dispositivo{email ? ` (${email})` : ""}.
        </p>
      </header>
      <Button type="button" variant="danger" onClick={() => void onSignOut()}>
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </Button>
    </div>
  );
}

export function SegurancaSection() {
  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-neutral-black">
          Segurança
        </h2>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Proteja sua conta e gerencie suas sessões
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <ChangePasswordCard />
        <SignOutEverywhereCard />
      </div>
    </section>
  );
}
