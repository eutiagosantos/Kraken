import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MockAccount } from "@/lib/mock-data";
import type { Creative } from "@/lib/stores/wizardStore";
import { cn } from "@/lib/utils";
import { AccountSelectItem } from "./AccountSelectItem";
import { CreativeGrid } from "./CreativeGrid";
import { StepFooter } from "./StepFooter";

interface Step1CreativesProps {
  creatives: Creative[];
  accounts: MockAccount[];
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

  const handleFileList = (list: FileList | null) => {
    if (!list?.length) return;
    onAddCreativeFiles(Array.from(list));
  };

  return (
    <>
      <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h3 className="text-base font-semibold text-white">Criativos</h3>
          <p className="mb-3 text-sm text-[#686b82]">Imagens e vídeos para os anúncios</p>
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
                : "border-[#2a2f45] bg-[#0d0f14] hover:border-[#7132f5]"
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
            <p className="mt-2 font-medium text-white">Arraste arquivos aqui</p>
            <p className="text-sm text-[#686b82]">PNG, JPG, MP4, MOV — até 4GB por arquivo</p>
            <Button variant="subtle" className="mt-4">
              Selecionar arquivos
            </Button>
          </button>
          {creatives.length ? <CreativeGrid creatives={creatives} onRemove={onRemoveCreative} /> : null}
        </section>

        <section>
          <h3 className="text-base font-semibold text-white">Contas Meta</h3>
          <p className="mb-3 text-sm text-[#686b82]">Selecione onde publicar</p>
          <input
            value={accountQuery}
            onChange={(event) => onAccountQueryChange(event.target.value)}
            placeholder="Buscar conta..."
            className="mb-3 w-full rounded-lg border border-[#1e2130] bg-[#141720] px-3 py-2 text-sm text-white outline-none focus:border-[#7132f5]"
          />
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {accounts.map((account) => (
              <AccountSelectItem
                key={account.id}
                account={account}
                selected={selectedAccountIds.includes(account.id)}
                onToggle={() => onToggleAccount(account.id)}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-[#686b82]">
            <span>{selectedAccountIds.length} conta(s) selecionada(s)</span>
            <button type="button" className="text-[#7132f5]" onClick={onSelectAllAccounts}>
              Selecionar todas
            </button>
          </div>
        </section>
      </div>
      <StepFooter
        left={<div />}
        right={
          <Button
            onClick={onNext}
            disabled={creatives.length === 0 || selectedAccountIds.length === 0}
            className="px-5 py-2.5 text-sm"
          >
            Continuar → Configuração
          </Button>
        }
      />
    </>
  );
}
