import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/docs/CodeBlock";
import type { McpToolDoc } from "@/lib/docs/mcp-tools-data";

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
      className="scroll-mt-24 rounded-card border border-neutral-border bg-white p-5 shadow-subtle"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-base font-semibold text-neutral-black">{tool.name}</h3>
        <Badge variant={categoryVariant[tool.category]}>{tool.category}</Badge>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-neutral-gray">{tool.description}</p>

      {tool.params.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-border text-xs uppercase tracking-wide text-neutral-gray">
                <th className="pb-2 pr-4 font-medium">Parâmetro</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Obrigatório</th>
                <th className="pb-2 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {tool.params.map((p) => (
                <tr key={p.name} className="border-b border-neutral-border/60 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-brand-purple">{p.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-neutral-gray">{p.type}</td>
                  <td className="py-2 pr-4 text-neutral-black">{p.required ? "Sim" : "Não"}</td>
                  <td className="py-2 text-neutral-gray">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mb-4 text-xs text-neutral-gray">Sem parâmetros de entrada.</p>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-gray">
        Exemplo de resposta
      </p>
      <CodeBlock code={tool.responseExample} language="json" />
    </article>
  );
}
