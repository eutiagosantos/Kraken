"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useKrakenUser } from "@/lib/hooks/useKrakenUser";
import { useSupabase } from "@/lib/hooks/useSupabase";

const MIN_PASSWORD_LENGTH = 8;

function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="rounded-md p-1.5 text-dashboard-muted transition-colors hover:bg-[rgba(148,151,169,0.12)] hover:text-neutral-black"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function ChangePasswordCard() {
  const supabase = useSupabase();
  const { email } = useKrakenUser();
  const { showSuccess } = useSuccessFeedback();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});

  const canSubmit =
    !saving &&
    currentPwd.length > 0 &&
    newPwd.length >= MIN_PASSWORD_LENGTH &&
    confirmPwd === newPwd &&
    newPwd !== currentPwd;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: typeof fieldErrors = {};
    if (!currentPwd) errs.current = "Informe sua senha atual.";
    if (newPwd.length < MIN_PASSWORD_LENGTH)
      errs.next = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirmPwd !== newPwd) errs.confirm = "As senhas não coincidem.";
    if (newPwd && newPwd === currentPwd)
      errs.next = "A nova senha deve ser diferente da atual.";
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    if (!email) {
      setError("Não foi possível identificar a sessão. Faça login novamente.");
      return;
    }

    setSaving(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPwd,
    });
    if (reauthError) {
      setSaving(false);
      setFieldErrors({ current: "Senha atual incorreta." });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPwd,
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message || "Não foi possível atualizar a senha.");
      return;
    }

    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    showSuccess("Senha atualizada com sucesso.");
  };

  return (
    <div className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h3 className="font-display text-base font-bold tracking-tight text-neutral-black">
          Alterar senha
        </h3>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Use uma senha forte com pelo menos {MIN_PASSWORD_LENGTH} caracteres
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          id="seg-current-pwd"
          label="Senha atual"
          type={showCurrent ? "text" : "password"}
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          autoComplete="current-password"
          disabled={saving}
          error={fieldErrors.current}
          suffix={
            <PasswordToggle
              visible={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              label={showCurrent ? "Ocultar senha atual" : "Mostrar senha atual"}
            />
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="seg-new-pwd"
            label="Nova senha"
            type={showNew ? "text" : "password"}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
            disabled={saving}
            error={fieldErrors.next}
            suffix={
              <PasswordToggle
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
                label={showNew ? "Ocultar nova senha" : "Mostrar nova senha"}
              />
            }
          />
          <Input
            id="seg-confirm-pwd"
            label="Confirmar nova senha"
            type={showConfirm ? "text" : "password"}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
            disabled={saving}
            error={fieldErrors.confirm}
            suffix={
              <PasswordToggle
                visible={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
              />
            }
          />
        </div>

        {error ? (
          <p className="text-sm text-semantic-red" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Atualizando…
              </>
            ) : (
              "Atualizar senha"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SignOutEverywhereCard() {
  const supabase = useSupabase();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !signingOut) setConfirmOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen, signingOut]);

  const onConfirm = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "global" }),
      });
      await supabase.auth.signOut({ scope: "global" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      setSigningOut(false);
      setError(
        e instanceof Error ? e.message : "Não foi possível encerrar as sessões."
      );
    }
  };

  return (
    <>
      <div className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
        <header className="mb-4">
          <h3 className="font-display text-base font-bold tracking-tight text-neutral-black">
            Sair de todos os dispositivos
          </h3>
          <p className="mt-0.5 text-sm text-neutral-silver">
            Encerre todas as sessões ativas e exija novo login em cada
            dispositivo
          </p>
        </header>

        <div className="flex flex-col gap-3 rounded-btn border border-semantic-yellow/30 bg-semantic-yellow-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-neutral-black">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-semantic-yellow"
              aria-hidden
            />
            <p>
              Use isto se desconfiar que sua conta foi acessada em outro
              dispositivo. Você também será desconectado aqui.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            className="shrink-0 self-start px-4 py-2.5 text-sm sm:self-auto"
            onClick={() => setConfirmOpen(true)}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair em todos
          </Button>
        </div>
      </div>

      <ModalPortal>
        <AnimatePresence>
          {confirmOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-[120] bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !signingOut && setConfirmOpen(false)}
                aria-hidden
              />
              <div className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center p-4">
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="sair-todos-title"
                  className="pointer-events-auto w-full max-w-md rounded-card border border-dashboard-border bg-dashboard-surface p-6 text-center shadow-card"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertTriangle
                    className="mx-auto h-10 w-10 text-semantic-red"
                    aria-hidden
                  />
                  <h3
                    id="sair-todos-title"
                    className="mt-4 font-display text-lg font-bold text-neutral-black"
                  >
                    Sair de todos os dispositivos?
                  </h3>
                  <p className="mt-2 text-sm text-neutral-gray">
                    Todas as sessões ativas serão encerradas. Você precisará
                    fazer login novamente em cada dispositivo, incluindo este.
                  </p>
                  {error ? (
                    <p
                      className="mt-4 text-left text-sm font-medium text-semantic-red"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-4 py-2.5 text-sm"
                      disabled={signingOut}
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-4 py-2.5 text-sm"
                      disabled={signingOut}
                      onClick={() => void onConfirm()}
                    >
                      {signingOut ? (
                        <>
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin"
                            aria-hidden
                          />
                          Encerrando…
                        </>
                      ) : (
                        "Sair em todos"
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </>
          ) : null}
        </AnimatePresence>
      </ModalPortal>
    </>
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
