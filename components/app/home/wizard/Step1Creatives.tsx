import { Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MockAccount } from "@/lib/mock-data";
import type { Creative } from "@/lib/stores/wizardStore";
import { useWizardStore } from "@/lib/stores/wizardStore";
import { cn } from "@/lib/utils";
import { AccountSelectItem } from "./AccountSelectItem";
import { CreativeGrid } from "./CreativeGrid";
import { StepFooter } from "./StepFooter";

interface Step1CreativesProps {
  creatives: Creative[];
  accounts: MockAccount[];
  accountsLoading: boolean;
  accountsLoadError: string | null;
  hasNoAccountsAfterLoad: boolean;
  selectedAccountIds: string[];
  accountQuery: string;
  onAccountQueryChange: (query: string) => void;
  onToggleAccount: (id: string) => void;
  onAddCreativeFiles: (files: File[]) => void;
  onRemoveCreative: (id: string) => void;
  onSelectAllAccounts: () => void;
  onNext: () => void;
}

export function Step1Creatives({
  creatives,
  accounts,
  accountsLoading,
  accountsLoadError,
  hasNoAccountsAfterLoad,
  selectedAccountIds,
  accountQuery,
  onAccountQueryChange,
  onToggleAccount,
  onAddCreativeFiles,
  onRemoveCreative,
  onSelectAllAccounts,
  onNext,
}: Step1CreativesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const pageId = useWizardStore((s) => s.pageId);
  const setPageId = useWizardStore((s) => s.setPageId);

  type WizardFbPage = { id: string; name: string; pictureUrl?: string };
  const [fbPages, setFbPages] = useState<WizardFbPage[]>([]);
  const [fbPagesLoading, setFbPagesLoading] = useState(false);
  const [fbPagesError, setFbPagesError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountIds.length === 0) {
      setFbPages([]);
      setFbPagesError(null);
      setFbPagesLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      setFbPagesLoading(true);
      setFbPagesError(null);
      try {
        const res = await fetch("/api/wizard/pages", { credentials: "include" });
        const raw = (await res.json().catch(() => ({}))) as { error?: string; data?: WizardFbPage[] };
        if (!res.ok) {
          throw new Error(typeof raw.error === "string" ? raw.error : `Pedido falhou (${res.status})`);
        }
        const data = raw.data ?? [];
        if (!cancelled) setFbPages(data);
      } catch (e) {
        if (!cancelled) {
          setFbPages([]);
          setFbPagesError(e instanceof Error ? e.message : "Não foi possível carregar as páginas.");
        }
      } finally {
        if (!cancelled) setFbPagesLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedAccountIds.length]);

  useEffect(() => {
    if (pageId && fbPages.length > 0 && !fbPages.some((p) => p.id === pageId)) {
      setPageId(null);
    }
  }, [fbPages, pageId, setPageId]);

  const handleFileList = (list: FileList | null) => {
    if (!list?.length) return;
    onAddCreativeFiles(Array.from(list));
  };

  return (
    <>
      <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h3 className="text-base font-semibold text-gray-900">Criativos</h3>
          <p className="mb-3 text-sm text-gray-500">Imagens e vídeos para os anúncios</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              handleFileList(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            className={cn(
              "w-full rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragActive
                ? "border-[#7132f5] bg-[rgba(113,50,245,0.04)]"
                : "border-gray-300 bg-gray-50 hover:border-[#7132f5]"
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFileList(event.dataTransfer.files);
            }}
          >
            <UploadCloud className="mx-auto h-9 w-9 text-[#7132f5]" />
            <p className="mt-2 font-medium text-gray-900">Arraste arquivos aqui</p>
            <p className="text-sm text-gray-500">PNG, JPG, MP4, MOV — até 4GB por arquivo</p>
            <Button variant="subtle" className="mt-4">
              Selecionar arquivos
            </Button>
          </button>
          {creatives.length ? <CreativeGrid creatives={creatives} onRemove={onRemoveCreative} /> : null}
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900">Contas Meta</h3>
          <p className="mb-3 text-sm text-gray-500">Selecione onde publicar</p>
          <input
            value={accountQuery}
            onChange={(event) => onAccountQueryChange(event.target.value)}
            placeholder="Buscar conta..."
            disabled={accountsLoading}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#7132f5] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          />
          <div className="max-h-[360px] min-h-[120px] space-y-2 overflow-y-auto pr-1">
            {accountsLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#7132f5]" aria-hidden />
                <p>A carregar contas Meta…</p>
              </div>
            ) : accountsLoadError ? (
              <p className="py-4 text-sm text-red-600">{accountsLoadError}</p>
            ) : hasNoAccountsAfterLoad ? (
              <p className="py-4 text-sm text-gray-600">
                Nenhuma conta Meta ligada.{" "}
                <Link href="/contas-meta" className="font-medium text-[#7132f5] underline-offset-2 hover:underline">
                  Gerir contas Meta
                </Link>
              </p>
            ) : accounts.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">Nenhuma conta corresponde à pesquisa.</p>
            ) : (
              accounts.map((account) => (
                <AccountSelectItem
                  key={account.id}
                  account={account}
                  selected={selectedAccountIds.includes(account.id)}
                  onToggle={() => onToggleAccount(account.id)}
                />
              ))
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>{selectedAccountIds.length} conta(s) selecionada(s)</span>
            <button
              type="button"
              className="text-[#7132f5] disabled:cursor-not-allowed disabled:text-gray-400"
              disabled={accountsLoading || hasNoAccountsAfterLoad || Boolean(accountsLoadError)}
              onClick={onSelectAllAccounts}
            >
              Selecionar todas
            </button>
          </div>

          {selectedAccountIds.length > 0 ? (
            <div className="mt-5 border-t border-gray-200 pt-4">
              <h4 className="text-base font-semibold text-gray-900">Página Facebook</h4>
              <p className="mb-2 text-sm text-gray-500">
                Identidade dos anúncios no Facebook. Se a lista estiver vazia, volta a entrar com Meta para aceitar as
                permissões de páginas.
              </p>
              {fbPagesLoading ? (
                <p className="text-sm text-gray-500">A carregar páginas…</p>
              ) : fbPagesError ? (
                <p className="text-sm text-red-600">{fbPagesError}</p>
              ) : fbPages.length === 0 ? (
                <p className="text-sm text-amber-800">
                  Nenhuma página encontrada. Em Contas Meta, reconecta a conta — são necessárias as permissões{" "}
                  <code className="rounded bg-gray-100 px-1">pages_show_list</code> e{" "}
                  <code className="rounded bg-gray-100 px-1">pages_manage_ads</code>.
                </p>
              ) : (
                <select
                  value={pageId ?? ""}
                  onChange={(e) => setPageId(e.target.value.trim() || null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#7132f5]"
                >
                  <option value="">Seleciona uma página…</option>
                  {fbPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
        </section>
      </div>
      <StepFooter
        left={<div />}
        right={
          <Button
            onClick={onNext}
            disabled={creatives.length === 0 || selectedAccountIds.length === 0 || !pageId}
            className="px-5 py-2.5 text-sm"
          >
            Continuar → Configuração
          </Button>
        }
      />
    </>
  );
}
