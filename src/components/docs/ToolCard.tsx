import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/docs/CodeBlock";
import type { McpToolDoc } from "@/libs/docs/mcp-tools-data";

const categoryVariant = {
  Leitura: "neutral",
  Pesquisa: "purple",
  Sincronização: "success",
  Publicação: "purple",
} as const;

type ToolCardProps = {
  tool: McpToolDoc;
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <article
      id={`tool-${tool.name}`}
      className="scroll-mt-24 rounded-xl border border-neutral-border bg-white p-5"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-base font-semibold text-neutral-black">{tool.name}</h3>
        <Badge variant={categoryVariant[tool.category]}>{tool.category}</Badge>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-neutral-gray">{tool.description}</p>

      {tool.params.length > 0 ? (
        <details className="group/details mb-4 overflow-hidden rounded-lg border border-neutral-border bg-[#FAFAF7]/80">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-neutral-black marker:content-none [&::-webkit-details-marker]:hidden">
            <span>
              Parâmetros{" "}
              <span className="font-normal text-neutral-gray">({tool.params.length})</span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-neutral-gray transition-transform group-open/details:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="overflow-x-auto border-t border-neutral-border bg-white">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-border text-xs uppercase tracking-wide text-neutral-gray">
                  <th className="px-4 pb-2 pt-3 font-medium">Parâmetro</th>
                  <th className="px-4 pb-2 pt-3 font-medium">Tipo</th>
                  <th className="px-4 pb-2 pt-3 font-medium">Obrigatório</th>
                  <th className="px-4 pb-2 pt-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {tool.params.map((p) => (
                  <tr key={p.name} className="border-b border-neutral-border/60 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-brand-purple">{p.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-gray">{p.type}</td>
                    <td className="px-4 py-2 text-neutral-black">{p.required ? "Sim" : "Não"}</td>
                    <td className="px-4 py-2 text-neutral-gray">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : (
        <p className="mb-4 rounded-lg border border-dashed border-neutral-border px-3 py-2 text-xs text-neutral-gray">
          Sem parâmetros de entrada.
        </p>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-gray">
        Exemplo de resposta
      </p>
      <CodeBlock code={tool.responseExample} language="json" />
    </article>
  );
}
