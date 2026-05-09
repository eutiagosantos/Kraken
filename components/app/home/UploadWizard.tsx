"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  DollarSign,
  ImageIcon,
  Layers,
  Play,
  Shield,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/app/ui/ProgressBar";
import { StepIndicator } from "@/components/app/ui/StepIndicator";
import {
  campaignObjectives,
  mockAccounts,
  structureOptions,
  type MockAccount,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type UploadedItem = { id: string; file: File; url: string };

function parseStructure(structure: string): { adSetsPerCampaign: number; adsPerAdSet: number } {
  if (structure === "Personalizada") return { adSetsPerCampaign: 10, adsPerAdSet: 1 };
  const p = structure.split("-").map((x) => Number(x));
  if (p.length === 3 && p.every((n) => !Number.isNaN(n)))
    return { adSetsPerCampaign: p[1], adsPerAdSet: p[2] };
  return { adSetsPerCampaign: 50, adsPerAdSet: 1 };
}

function computeTotals(
  numAccounts: number,
  numCreatives: number,
  structure: string
): { campaigns: number; adSets: number; ads: number } {
  const campaigns = Math.max(0, numAccounts * numCreatives);
  const { adSetsPerCampaign, adsPerAdSet } = parseStructure(structure);
  const adSets = campaigns * adSetsPerCampaign;
  const ads = adSets * adsPerAdSet;
  return { campaigns, adSets, ads };
}

function AccountItem({
  account,
  selected,
  onToggle,
}: {
  account: MockAccount;
  selected: boolean;
  onToggle: () => void;
}) {
  const suspended = account.status === "suspenso";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors",
        selected
          ? "border-[1.5px] border-brand-purple bg-[rgba(113,50,245,0.05)]"
          : "border border-dashboard-border bg-dashboard-surface hover:border-dashboard-border-strong",
        suspended && "opacity-75"
      )}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-neutral-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : null}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(148,151,169,0.12)] text-neutral-gray">
        <Building2 className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-black">{account.name}</p>
        <p className="text-sm text-dashboard-muted">{account.id}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              suspended ? "bg-semantic-yellow-bg text-semantic-yellow" : "bg-semantic-green-bg text-semantic-green"
            )}
          >
            {suspended ? "Suspenso" : "Ativo"}
          </span>
          <span className="text-xs text-neutral-gray">{account.spend} gasto (30d)</span>
        </div>
      </div>
    </button>
  );
}

function DropZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (!disabled && e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
          drag
            ? "border-brand-purple bg-[rgba(113,50,245,0.06)]"
            : "border-dashboard-border-strong bg-[#fafafc] hover:border-brand-purple hover:bg-[rgba(113,50,245,0.03)]",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-brand-purple" />
        <p className="mt-3 font-semibold text-neutral-black">Arraste imagens e vídeos aqui</p>
        <p className="mt-1 text-sm text-dashboard-muted">ou clique para selecionar</p>
        <Badge variant="neutral" className="mt-4">
          PNG, JPG, MP4 — até 4GB por arquivo
        </Badge>
      </button>
    </>
  );
}

function FilePreviewGrid({
  items,
  onRemove,
}: {
  items: UploadedItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
      {items.map((item) => {
        const isVideo = item.file.type.startsWith("video/");
        return (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg border border-dashboard-border bg-neutral-black/5"
          >
            <div className="aspect-square w-full">
              {isVideo ? (
                <div className="relative flex h-full w-full items-center justify-center bg-neutral-black">
                  <video src={item.url} className="h-full w-full object-cover opacity-60" muted />
                  <Play className="absolute h-8 w-8 text-neutral-white drop-shadow" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="truncate px-1 py-1 text-[10px] font-medium text-neutral-gray" title={item.file.name}>
              {item.file.name}
            </p>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-1 top-1 rounded-md bg-neutral-black/70 p-0.5 text-neutral-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StructureSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {structureOptions.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
            value === opt
              ? "border-brand-purple bg-brand-purple-subtle text-brand-purple"
              : "border-dashboard-border bg-dashboard-surface text-neutral-gray hover:border-dashboard-border-strong"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashboard-border bg-[#fafafc] px-3 py-2.5 text-left"
    >
      <span className="text-sm font-semibold text-neutral-black">{label}</span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          on ? "bg-brand-purple" : "bg-[rgba(148,151,169,0.35)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-neutral-white shadow transition-[left] duration-200",
            on ? "left-[calc(100%-1.625rem)]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

function CampaignStructurePreview({
  accounts,
  creatives,
  structure,
}: {
  accounts: number;
  creatives: number;
  structure: string;
}) {
  const { campaigns, adSets, ads } = computeTotals(accounts, creatives, structure);
  return (
    <div className="rounded-xl border border-dashboard-border bg-[#fafafc] p-4">
      <ul className="space-y-3 text-sm">
        <li className="flex justify-between gap-2 border-b border-dashboard-border pb-2">
          <span className="text-neutral-gray">Campanhas</span>
          <span className="font-bold text-neutral-black">{campaigns}</span>
        </li>
        <li className="flex justify-between gap-2 border-b border-dashboard-border pb-2 pl-4">
          <span className="text-neutral-gray">Conjuntos de anúncios</span>
          <span className="font-bold text-neutral-black">{adSets}</span>
        </li>
        <li className="flex justify-between gap-2 pl-8">
          <span className="text-neutral-gray">Anúncios</span>
          <span className="font-bold text-brand-purple">{ads}</span>
        </li>
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-dashboard-muted">
        Estrutura <strong className="text-neutral-black">{structure}</strong> — multiplicadores aplicados por
        conta e criativo ({accounts} × {creatives} campanhas na raiz).
      </p>
    </div>
  );
}

function ReviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-surface p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand-purple-subtle text-brand-purple">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-dashboard-muted">{label}</p>
        <p className="font-display text-xl font-bold text-neutral-black">{value}</p>
      </div>
    </div>
  );
}

export function UploadWizard() {
  const baseId = useId();
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [accountQuery, setAccountQuery] = useState("");
  const [config, setConfig] = useState({
    campaignName: "",
    objective: "Conversões",
    dailyBudget: "",
    structure: "1-50-1",
    antiSpy: true,
  });

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const publishTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return mockAccounts;
    return mockAccounts.filter(
      (a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
    );
  }, [accountQuery]);

  const toggleAccount = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setUploads((prev) => {
      const next = [...prev];
      for (const file of arr) {
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        next.push({ id, file, url: URL.createObjectURL(file) });
      }
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploads((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.url));
      if (publishTimer.current) clearInterval(publishTimer.current);
    };
  }, []);

  const numAccounts = selectedIds.length;
  const numCreatives = uploads.length;
  const totals = computeTotals(numAccounts, numCreatives, config.structure);

  const selectedAccounts = mockAccounts.filter((a) => selectedIds.includes(a.id));

  const startPublish = () => {
    setPublishOpen(true);
    setPublishProgress(0);
    if (publishTimer.current) clearInterval(publishTimer.current);
    publishTimer.current = setInterval(() => {
      setPublishProgress((p) => {
        if (p >= 100) {
          if (publishTimer.current) clearInterval(publishTimer.current);
          return 100;
        }
        return Math.min(100, p + Math.random() * 18 + 5);
      });
    }, 320);
  };

  useEffect(() => {
    if (publishProgress >= 100 && publishOpen) {
      const t = setTimeout(() => {
        setPublishOpen(false);
        setPublishProgress(0);
        setStep(1);
        setSelectedIds([]);
        setUploads((prev) => {
          prev.forEach((u) => URL.revokeObjectURL(u.url));
          return [];
        });
        setConfig((c) => ({ ...c, campaignName: "", dailyBudget: "" }));
      }, 900);
      return () => clearTimeout(t);
    }
  }, [publishProgress, publishOpen]);

  const budgetDisplay =
    config.dailyBudget.trim() !== ""
      ? `R$ ${config.dailyBudget}`
      : "R$ 150,00";

  const slide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  };

  return (
    <div
      id="upload-wizard"
      className="rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] md:p-7"
    >
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" {...slide}>
            <h2 className="font-display text-xl font-bold text-neutral-black md:text-display-md">
              Selecione as contas onde publicar
            </h2>
            <p className="mt-1 text-sm text-dashboard-muted">Selecione uma ou mais contas do Meta Ads</p>
            <input
              type="search"
              placeholder="Buscar conta por nome ou ID..."
              value={accountQuery}
              onChange={(e) => setAccountQuery(e.target.value)}
              className="mt-5 w-full rounded-lg border border-dashboard-border px-3 py-2.5 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              aria-label="Buscar contas"
            />
            <div className="mt-4 flex max-h-[min(320px,45vh)] flex-col gap-2 overflow-y-auto pr-1">
              {filteredAccounts.map((a) => (
                <AccountItem
                  key={a.id}
                  account={a}
                  selected={selectedIds.includes(a.id)}
                  onToggle={() => toggleAccount(a.id)}
                />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashboard-border pt-5">
              <span className="text-sm text-neutral-gray">{selectedIds.length} conta(s) selecionada(s)</span>
              <Button disabled={!selectedIds.length} onClick={() => setStep(2)}>
                Continuar →
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div key="s2" {...slide}>
            <h2 className="font-display text-xl font-bold text-neutral-black md:text-display-md">
              Faça upload dos seus criativos
            </h2>
            <DropZone onFiles={addFiles} />
            <FilePreviewGrid items={uploads} onRemove={removeFile} />
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-dashboard-border pt-5">
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <Button disabled={!uploads.length} onClick={() => setStep(3)}>
                Continuar →
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 3 ? (
          <motion.div key="s3" {...slide}>
            <h2 className="font-display text-xl font-bold text-neutral-black md:text-display-md">
              Configurar campanhas
            </h2>
            <div className="mt-5 grid gap-8 lg:grid-cols-2">
              <div className="space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-dashboard-muted">
                  Configurações globais
                </h3>
                <div>
                  <label htmlFor={`${baseId}-name`} className="text-sm font-semibold text-neutral-black">
                    Nome das campanhas
                  </label>
                  <input
                    id={`${baseId}-name`}
                    value={config.campaignName}
                    onChange={(e) => setConfig((c) => ({ ...c, campaignName: e.target.value }))}
                    placeholder="Ex: {conta} - {criativo} - {data}"
                    className="mt-1.5 w-full rounded-lg border border-dashboard-border px-3 py-2.5 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                  />
                  <p className="mt-1 text-xs text-dashboard-muted">
                    Use variáveis dinâmicas: {"{conta}"}, {"{criativo}"}, {"{data}"}
                  </p>
                </div>
                <div>
                  <label htmlFor={`${baseId}-obj`} className="text-sm font-semibold text-neutral-black">
                    Objetivo da campanha
                  </label>
                  <select
                    id={`${baseId}-obj`}
                    value={config.objective}
                    onChange={(e) => setConfig((c) => ({ ...c, objective: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2.5 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                  >
                    {campaignObjectives.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${baseId}-budget`} className="text-sm font-semibold text-neutral-black">
                    Orçamento diário
                  </label>
                  <div className="mt-1.5 flex rounded-lg border border-dashboard-border focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20">
                    <span className="flex items-center border-r border-dashboard-border bg-[#fafafc] px-3 text-sm font-semibold text-neutral-gray">
                      R$
                    </span>
                    <input
                      id={`${baseId}-budget`}
                      value={config.dailyBudget}
                      onChange={(e) => setConfig((c) => ({ ...c, dailyBudget: e.target.value }))}
                      placeholder="50,00"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-black">Estrutura</p>
                  <div className="mt-2">
                    <StructureSelector
                      value={config.structure}
                      onChange={(structure) => setConfig((c) => ({ ...c, structure }))}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-black">Anti-Spy</p>
                  <div className="mt-2 space-y-2">
                    <Toggle
                      label="Ativar modo Anti-Spy"
                      on={config.antiSpy}
                      onToggle={() => setConfig((c) => ({ ...c, antiSpy: !c.antiSpy }))}
                    />
                    <p className="text-xs text-dashboard-muted">
                      Randomiza FanPages e camufla links de exibição
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-dashboard-muted">
                  Preview da estrutura
                </h3>
                <div className="mt-4">
                  <CampaignStructurePreview
                    accounts={numAccounts}
                    creatives={numCreatives}
                    structure={config.structure}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-dashboard-border pt-5">
              <Button variant="secondary" onClick={() => setStep(2)}>
                ← Voltar
              </Button>
              <Button onClick={() => setStep(4)}>Continuar →</Button>
            </div>
          </motion.div>
        ) : null}

        {step === 4 ? (
          <motion.div key="s4" {...slide}>
            <h2 className="font-display text-xl font-bold text-neutral-black md:text-display-md">
              Revisão final
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ReviewCard icon={Users} label="Contas" value={numAccounts} />
              <ReviewCard icon={ImageIcon} label="Criativos" value={numCreatives} />
              <ReviewCard icon={Layers} label="Campanhas" value={totals.campaigns} />
              <ReviewCard icon={DollarSign} label="Orçamento/dia" value={budgetDisplay} />
            </div>
            <div className="mt-6 rounded-xl border border-dashboard-border bg-[#fafafc] p-4">
              <p className="text-sm font-semibold text-neutral-black">Contas selecionadas</p>
              <ul className="mt-3 space-y-2">
                {selectedAccounts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-neutral-black">{a.name}</span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        a.status === "suspenso"
                          ? "bg-semantic-yellow-bg text-semantic-yellow"
                          : "bg-semantic-green-bg text-semantic-green"
                      )}
                    >
                      {a.status === "suspenso" ? "Suspenso" : "Ativo"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {config.antiSpy ? (
              <div className="mt-4 flex gap-3 rounded-xl border border-semantic-green/25 bg-semantic-green-bg px-4 py-3 text-sm font-medium text-semantic-green-dark">
                <Shield className="h-5 w-5 shrink-0 text-semantic-green" />
                Anti-Spy ativado — suas FanPages e criativos estarão protegidos
              </div>
            ) : null}
            <Button className="mt-6 w-full py-4 text-base" onClick={startPublish}>
              🚀 Publicar {totals.campaigns} campanhas
            </Button>
            <p className="mt-2 text-center text-sm text-dashboard-muted">
              Isso pode levar alguns minutos. Você pode acompanhar o progresso em tempo real.
            </p>
            <div className="mt-5 flex justify-start">
              <Button variant="secondary" onClick={() => setStep(3)}>
                ← Voltar
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {publishOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            >
              <p className="font-display text-lg font-bold text-neutral-black">Publicando campanhas</p>
              <p className="mt-1 text-sm text-dashboard-muted">
                {publishProgress < 100 ? "Processando no Meta Ads…" : "Concluído!"}
              </p>
              <div className="mt-5">
                <ProgressBar value={publishProgress} />
                <p className="mt-2 text-right text-xs font-semibold text-brand-purple">
                  {Math.round(Math.min(publishProgress, 100))}%
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
