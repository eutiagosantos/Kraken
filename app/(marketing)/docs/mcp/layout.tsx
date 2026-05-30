import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export const metadata: Metadata = {
  title: "Documentação MCP | Kraken",
  description:
    "Configure o servidor MCP do Kraken em Claude, ChatGPT e outras LLMs. Referência completa de tools.",
};

export default function McpDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAFAF7] landing-grain lg:flex-row">
      <DocsSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
