"use client";

import { McpKeysPanel } from "./McpKeysPanel";
import { MetaAppPanel } from "./MetaAppPanel";
import { PerfilSection } from "./PerfilSection";
import { SegurancaSection } from "./SegurancaSection";
import { WorkspaceSection } from "./WorkspaceSection";

export function ConfiguracoesClient() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-black md:text-display-md">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-neutral-gray">
          Gerencie seu workspace, perfil, app Meta e segurança da conta
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <WorkspaceSection />
        <PerfilSection />
        <MetaAppPanel />
        <McpKeysPanel />
        <SegurancaSection />
      </div>
    </div>
  );
}
