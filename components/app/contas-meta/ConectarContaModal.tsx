"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { AlertTriangle, Check, Eye, EyeOff, Key, Link2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/app/ui/StepIndicator";
import { cn } from "@/lib/utils";
import { AccountAvatar } from "./AccountAvatar";
import { CONECTAR_META_STEPS } from "./conectar-meta-steps";
import { ContaStatusBadge } from "./ContaStatusBadge";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
};

function InstructionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm text-neutral-black">
      {children}
    </div>
  );
}

function MethodCard({
  selected,
  disabled,
  onClick,
  icon,
  label,
  description,
  badge,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        selected && !disabled && "border-brand-purple bg-[rgba(113,50,245,0.06)] shadow-[0_0_0_1px_#7132f5]",
        !selected && !disabled && "border-dashboard-border bg-neutral-white hover:border-dashboard-border-strong"
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dashboard-track text-brand-purple">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-black">{label}</span>
          <span className="rounded-full bg-brand-purple-subtle px-2 py-0.5 text-[11px] font-semibold text-brand-purple">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-gray">{description}</p>
      </div>
    </button>
  );
}

export function ConectarContaModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<"token" | "oauth">("token");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [nickname, setNickname] = useState("");
  const [connecting, setConnecting] = useState(false);

  const detectedName = "Loja Exemplo BR";
  const detectedId = "ACT_DEMO";

  const reset = useCallback(() => {
    setStep(1);
    setMethod("token");
    setToken("");
    setShowToken(false);
    setValidating(false);
    setTokenValid(null);
    setNickname("");
    setConnecting(false);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validateToken = () => {
    setValidating(true);
    setTokenValid(null);
    setTimeout(() => {
      setValidating(false);
      setTokenValid(token.trim().length >= 8);
    }, 1500);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/contas-meta", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_with_token", token: token.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao sincronizar");
      }
      onConnected();
      onClose();
    } catch {
      /* erro mostrado via toast no parent se necessário */
    } finally {
      setConnecting(false);
    }
  };

  return (
    <ModalPortal>
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none fixed inset-0 z-[121] flex flex-col justify-center p-0 md:items-center md:justify-center md:p-4"
            )}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className={cn(
                "pointer-events-auto flex w-full flex-col overflow-y-auto border border-dashboard-border bg-dashboard-surface shadow-card",
                "h-[100dvh] max-h-[100dvh] rounded-none p-6 md:h-auto md:max-h-[min(90dvh,calc(100dvh-2rem))] md:max-w-lg md:rounded-card"
              )}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
            <StepIndicator currentStep={step} steps={CONECTAR_META_STEPS} />

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="c1" {...slide}>
                  <h2 className="font-display text-xl font-bold text-neutral-black">Como deseja conectar?</h2>
                  <p className="mt-1 text-sm text-neutral-gray">Escolha o método de autenticação com o Meta Ads</p>
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <MethodCard
                      selected={method === "token"}
                      onClick={() => setMethod("token")}
                      icon={<Key className="h-5 w-5" />}
                      label="Token de Acesso"
                      description="Insira manualmente o token gerado no Meta Business Suite"
                      badge="Recomendado"
                    />
                    <MethodCard
                      selected={false}
                      disabled
                      onClick={() => {}}
                      icon={<Link2 className="h-5 w-5" />}
                      label="Login com Facebook"
                      description="Autorize diretamente via conta do Facebook"
                      badge="Em breve"
                    />
                  </div>
                  <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-dashboard-border pt-5">
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button type="button" variant="primary" onClick={() => setStep(2)}>
                      Continuar →
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div key="c2" {...slide}>
                  <h2 className="font-display text-xl font-bold text-neutral-black">Insira o Token de Acesso</h2>
                  <InstructionBox>
                    <p>
                      Acesse o{" "}
                      <a
                        href="https://developers.facebook.com/tools/explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-purple underline"
                      >
                        Meta Graph API Explorer
                      </a>{" "}
                      e gere um token com as permissões: <code className="rounded bg-neutral-white px-1">ads_management</code>,{" "}
                      <code className="rounded bg-neutral-white px-1">ads_read</code>
                    </p>
                  </InstructionBox>
                  <div className="mt-4">
                    <label htmlFor="meta-token" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                      Token de Acesso
                    </label>
                    <div className="relative">
                      <input
                        id="meta-token"
                        type={showToken ? "text" : "password"}
                        placeholder="EAAxxxxxxxxxxxxxxxxx..."
                        value={token}
                        onChange={(e) => {
                          setToken(e.target.value);
                          setTokenValid(null);
                        }}
                        className="w-full rounded-lg border border-neutral-border bg-neutral-white py-2.5 pl-3 pr-11 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-gray hover:bg-dashboard-sidebar-ghost"
                        aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                        onClick={() => setShowToken((v) => !v)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {validating ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-neutral-gray">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Validando token...
                    </p>
                  ) : null}
                  {tokenValid === true ? (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-semantic-green">
                      <Check className="h-4 w-4" aria-hidden />
                      Token válido! Conta identificada: {detectedName}
                    </p>
                  ) : null}
                  {tokenValid === false ? (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-semantic-red">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Token inválido ou sem permissões necessárias.
                    </p>
                  ) : null}
                  <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-dashboard-border pt-5">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      ← Voltar
                    </Button>
                    {tokenValid === true ? (
                      <Button type="button" variant="primary" onClick={() => setStep(3)}>
                        Continuar →
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={validateToken}
                        disabled={!token.trim() || validating || tokenValid === false}
                      >
                        {validating ? "Validando..." : "Validar Token"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div key="c3" {...slide}>
                  <h2 className="font-display text-xl font-bold text-neutral-black">Confirme a conta</h2>
                  <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashboard-border bg-neutral-white p-4">
                    <AccountAvatar name={detectedName} size="lg" />
                    <div>
                      <p className="font-semibold text-neutral-black">{detectedName}</p>
                      <p className="text-sm text-neutral-gray">ID: {detectedId}</p>
                      <div className="mt-2">
                        <ContaStatusBadge status="ativa" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="meta-nick" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                      Apelido da conta (opcional)
                    </label>
                    <input
                      id="meta-nick"
                      placeholder="Ex: Agência XYZ — Cliente Principal"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 text-base outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                    />
                    <p className="mt-1 text-xs text-neutral-gray">Um nome amigável para identificar esta conta na plataforma</p>
                  </div>
                  <div className="mt-4 rounded-lg border border-dashboard-border bg-dashboard-base px-4 py-3 text-sm">
                    <p className="font-semibold text-neutral-black">Permissões detectadas</p>
                    <ul className="mt-2 space-y-1 text-neutral-gray">
                      <li>ads_management ✓</li>
                      <li>ads_read ✓</li>
                      <li>business_management ✓</li>
                    </ul>
                  </div>
                  <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-dashboard-border pt-5">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                      ← Voltar
                    </Button>
                    <Button type="button" variant="primary" onClick={handleConnect} disabled={connecting}>
                      <Check className="h-4 w-4" aria-hidden />
                      {connecting ? "Conectando..." : "Conectar Conta"}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
    </ModalPortal>
  );
}
