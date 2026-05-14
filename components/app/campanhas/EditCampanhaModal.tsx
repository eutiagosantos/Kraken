"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ModalPortal } from "@/components/app/ui/ModalPortal";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencyInputBrl } from "@/components/ui/CurrencyInputBrl";
import { Input } from "@/components/ui/Input";
import type {
  Campanha,
  CampanhaCreative,
  CampanhaError,
  CampanhaStatus,
  CampanhaStructure,
} from "@/lib/mock-campanhas";

const objectives = ["Conversões", "Tráfego", "Vendas", "Leads", "Engajamento", "Instalações", "Visualizações"];

const structures: { value: CampanhaStructure; label: string }[] = [
  { value: "1-50-1", label: "1-50-1" },
  { value: "1-3-5", label: "1-3-5" },
  { value: "1-1-5", label: "1-1-5" },
];

const statuses: { value: CampanhaStatus; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "processando", label: "Processando" },
  { value: "concluida", label: "Concluída" },
  { value: "pausada", label: "Pausada" },
  { value: "erro", label: "Erro" },
];

export type CampanhaEditPatch = Partial<
  Pick<
    Campanha,
    | "name"
    | "account"
    | "accountId"
    | "structure"
    | "objective"
    | "dailyBudget"
    | "antiSpy"
    | "status"
    | "adsCreated"
    | "adsTotal"
    | "trend"
    | "creatives"
    | "errors"
  >
>;

const selectClass =
  "w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 font-ui text-base text-neutral-black outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25";

function parseTrendInput(raw: string): number[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s.replace(",", ".")))
    .filter((n) => Number.isFinite(n));
}

export function EditCampanhaModal({
  campanha,
  open,
  onClose,
  onSave,
}: {
  campanha: Campanha | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, patch: CampanhaEditPatch) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [structure, setStructure] = useState<CampanhaStructure>("1-50-1");
  const [dailyBudget, setDailyBudget] = useState(0);
  const [objective, setObjective] = useState("");
  const [antiSpy, setAntiSpy] = useState(false);
  const [status, setStatus] = useState<CampanhaStatus>("ativa");
  const [adsCreated, setAdsCreated] = useState("");
  const [adsTotal, setAdsTotal] = useState("");
  const [trendRaw, setTrendRaw] = useState("");
  const [creatives, setCreatives] = useState<CampanhaCreative[]>([]);
  const [errors, setErrors] = useState<CampanhaError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (campanha && open) {
      setName(campanha.name);
      setAccount(campanha.account);
      setAccountId(campanha.accountId);
      setStructure(campanha.structure);
      setDailyBudget(campanha.dailyBudget);
      setObjective(campanha.objective);
      setAntiSpy(campanha.antiSpy);
      setStatus(campanha.status);
      setAdsCreated(String(campanha.adsCreated));
      setAdsTotal(String(campanha.adsTotal));
      setTrendRaw(campanha.trend.length ? campanha.trend.join(", ") : "");
      setCreatives(campanha.creatives.map((c) => ({ ...c })));
      setErrors((campanha.errors ?? []).map((e) => ({ ...e })));
      setSaveError(null);
      setSubmitting(false);
    }
  }, [campanha, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleSave() {
    if (!campanha) return;
    void (async () => {
      const n = dailyBudget;
      const ac = parseInt(adsCreated, 10);
      const at = parseInt(adsTotal, 10);
      const trend = parseTrendInput(trendRaw);
      const creativesPayload = creatives
        .map((c) => ({
          id: c.id.trim() || crypto.randomUUID(),
          name: c.name.trim(),
          type: c.type,
          thumb: c.thumb.trim(),
        }))
        .filter((c) => c.name || c.thumb);
      const errorsPayload = errors
        .map((e) => ({
          id: e.id.trim() || crypto.randomUUID(),
          message: e.message.trim(),
          adName: e.adName.trim(),
        }))
        .filter((e) => e.message || e.adName);

      setSaveError(null);
      setSubmitting(true);
      try {
        await Promise.resolve(
          onSave(campanha.id, {
            name: name.trim() || campanha.name,
            account: account.trim() || campanha.account,
            accountId: accountId.trim() || campanha.accountId,
            structure,
            objective,
            dailyBudget: Number.isFinite(n) && n >= 0 ? n : campanha.dailyBudget,
            antiSpy,
            status,
            adsCreated: Number.isFinite(ac) && ac >= 0 ? ac : campanha.adsCreated,
            adsTotal: Number.isFinite(at) && at >= 0 ? at : campanha.adsTotal,
            trend,
            creatives: creativesPayload,
            errors: errorsPayload,
          })
        );
        onClose();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Não foi possível salvar.");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && campanha ? (
          <>
            <motion.div
              className="fixed inset-0 z-[120] bg-[rgba(16,17,20,0.35)] backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden
            />
            {/* Wrapper evita conflito entre transform do Framer Motion e translate do Tailwind */}
            <div className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-campanha-title"
                className="pointer-events-auto flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-dashboard-border bg-dashboard-surface shadow-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="shrink-0 border-b border-dashboard-border px-6 py-5">
                  <h2 id="edit-campanha-title" className="font-display text-xl font-bold text-neutral-black">
                    Editar campanha
                  </h2>
                  <p className="mt-1 text-sm text-neutral-gray">
                    Todos os campos são guardados na base de dados desta campanha.
                  </p>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input id="edit-name" label="Nome da campanha" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <Input id="edit-account" label="Conta (nome)" value={account} onChange={(e) => setAccount(e.target.value)} />
                    <Input
                      id="edit-account-id"
                      label="ID da conta Meta"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-neutral-black">Estrutura</span>
                      <select value={structure} onChange={(e) => setStructure(e.target.value as CampanhaStructure)} className={selectClass}>
                        {structures.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-neutral-black">Estado</span>
                      <select value={status} onChange={(e) => setStatus(e.target.value as CampanhaStatus)} className={selectClass}>
                        {statuses.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <CurrencyInputBrl
                      id="edit-budget"
                      label="Orçamento diário"
                      value={dailyBudget}
                      onValueChange={(v) => setDailyBudget(v ?? 0)}
                      min={0}
                      className="md:col-span-1"
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-neutral-black">Objetivo</span>
                      <select value={objective} onChange={(e) => setObjective(e.target.value)} className={selectClass}>
                        {(objectives.includes(objective) ? objectives : [objective, ...objectives]).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      id="edit-ads-created"
                      label="Anúncios criados"
                      inputMode="numeric"
                      value={adsCreated}
                      onChange={(e) => setAdsCreated(e.target.value.replace(/\D/g, ""))}
                    />
                    <Input
                      id="edit-ads-total"
                      label="Anúncios totais"
                      inputMode="numeric"
                      value={adsTotal}
                      onChange={(e) => setAdsTotal(e.target.value.replace(/\D/g, ""))}
                    />
                    <div className="md:col-span-2">
                      <label htmlFor="edit-trend" className="mb-1.5 block text-sm font-semibold text-neutral-black">
                        Tendência (sparkline)
                      </label>
                      <input
                        id="edit-trend"
                        type="text"
                        value={trendRaw}
                        onChange={(e) => setTrendRaw(e.target.value)}
                        placeholder="ex.: 12, 15, 10, 18…"
                        className="w-full rounded-lg border border-neutral-border bg-neutral-white px-3 py-2.5 font-ui text-base text-neutral-black outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                      />
                      <p className="mt-1 text-xs text-neutral-gray">Números separados por vírgula ou espaço.</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dashboard-border text-brand-purple focus:ring-brand-purple"
                        checked={antiSpy}
                        onChange={(e) => setAntiSpy(e.target.checked)}
                      />
                      <span className="text-sm font-medium text-neutral-black">Anti-Spy</span>
                    </label>
                  </div>

                  <section className="mt-8 border-t border-dashboard-border pt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-neutral-black">Criativos</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-1.5 px-2 py-1.5 text-xs"
                        onClick={() =>
                          setCreatives((prev) => [
                            ...prev,
                            { id: crypto.randomUUID(), name: "", type: "image" as const, thumb: "" },
                          ])
                        }
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {creatives.length === 0 ? (
                        <p className="text-sm text-neutral-gray">Sem criativos. Adicione linhas se precisar.</p>
                      ) : (
                        creatives.map((c, i) => (
                          <div
                            key={c.id || i}
                            className="grid gap-2 rounded-lg border border-dashboard-border bg-neutral-white/40 p-3 md:grid-cols-[1fr_1fr_minmax(0,100px)_auto]"
                          >
                            <Input
                              id={`cr-name-${i}`}
                              label="Nome"
                              value={c.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCreatives((prev) => prev.map((x, j) => (j === i ? { ...x, name: v } : x)));
                              }}
                            />
                            <Input
                              id={`cr-thumb-${i}`}
                              label="URL da miniatura"
                              value={c.thumb}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCreatives((prev) => prev.map((x, j) => (j === i ? { ...x, thumb: v } : x)));
                              }}
                            />
                            <label className="flex flex-col gap-1.5">
                              <span className="text-sm font-semibold text-neutral-black">Tipo</span>
                              <select
                                value={c.type}
                                onChange={(e) => {
                                  const v = e.target.value === "video" ? "video" : "image";
                                  setCreatives((prev) => prev.map((x, j) => (j === i ? { ...x, type: v } : x)));
                                }}
                                className={selectClass}
                              >
                                <option value="image">Imagem</option>
                                <option value="video">Vídeo</option>
                              </select>
                            </label>
                            <div className="flex items-end justify-end pb-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-10 w-10 shrink-0 p-0 text-semantic-red hover:bg-semantic-red/10"
                                aria-label="Remover criativo"
                                onClick={() => setCreatives((prev) => prev.filter((_, j) => j !== i))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="mt-8 border-t border-dashboard-border pt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-neutral-black">Erros</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-1.5 px-2 py-1.5 text-xs"
                        onClick={() =>
                          setErrors((prev) => [...prev, { id: crypto.randomUUID(), message: "", adName: "" }])
                        }
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {errors.length === 0 ? (
                        <p className="text-sm text-neutral-gray">Sem erros registados.</p>
                      ) : (
                        errors.map((er, i) => (
                          <div
                            key={er.id || i}
                            className="grid gap-2 rounded-lg border border-dashboard-border bg-neutral-white/40 p-3 md:grid-cols-[1fr_1fr_auto]"
                          >
                            <Input
                              id={`err-ad-${i}`}
                              label="Nome do anúncio"
                              value={er.adName}
                              onChange={(e) => {
                                const v = e.target.value;
                                setErrors((prev) => prev.map((x, j) => (j === i ? { ...x, adName: v } : x)));
                              }}
                            />
                            <Input
                              id={`err-msg-${i}`}
                              label="Mensagem"
                              value={er.message}
                              onChange={(e) => {
                                const v = e.target.value;
                                setErrors((prev) => prev.map((x, j) => (j === i ? { ...x, message: v } : x)));
                              }}
                            />
                            <div className="flex items-end justify-end pb-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-10 w-10 shrink-0 p-0 text-semantic-red hover:bg-semantic-red/10"
                                aria-label="Remover erro"
                                onClick={() => setErrors((prev) => prev.filter((_, j) => j !== i))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                {saveError ? (
                  <p className="shrink-0 border-t border-dashboard-border px-6 py-3 text-sm font-medium text-semantic-red" role="alert">
                    {saveError}
                  </p>
                ) : null}

                <div className="flex shrink-0 justify-end gap-2 border-t border-dashboard-border px-6 py-4">
                  <Button type="button" variant="ghost" className="px-4 py-2.5 text-sm" disabled={submitting} onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="primary" className="px-4 py-2.5 text-sm" disabled={submitting} onClick={handleSave}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        A guardar…
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </ModalPortal>
  );
}
