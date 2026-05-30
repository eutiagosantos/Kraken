import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ToolCard } from "@/components/docs/ToolCard";
import {
  MCP_DOCS_TOOLS,
  MCP_ENDPOINT_SNIPPETS,
} from "@/lib/docs/mcp-tools-data";

const PUBLISH_FLOW_STEPS = [
  {
    step: 1,
    tool: "list_ad_accounts",
    description: "Escolha as contas Meta (meta_account_id) para publicar.",
  },
  {
    step: 2,
    tool: "search_interests / search_locations",
    description: "Monte o objeto publico com interesses e localizações.",
  },
  {
    step: 3,
    tool: "list_facebook_pages",
    description: "Defina pageId na campanha com uma página acessível.",
  },
  {
    step: 4,
    tool: "prepare_campaign",
    description: "Valide o payload e reveja spendEstimate antes de publicar.",
  },
  {
    step: 5,
    tool: "publish_campaign",
    description: "Envie com confirm: true e os mesmos campos de campaign.",
  },
  {
    step: 6,
    tool: "get_publish_status",
    description: "Faça polling com jobId até status terminal (done ou error).",
  },
] as const;

const TOOLS_BY_CATEGORY = ["Leitura", "Pesquisa", "Sincronização", "Publicação"] as const;

export default function McpDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-8 lg:py-12">
      {/* 1. Introdução */}
      <section id="intro" className="scroll-mt-24 mb-16">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-purple">
          Kraken MCP
        </p>
        <h1 className="font-display text-display-md font-semibold text-neutral-black sm:text-display-lg">
          Documentação do Servidor MCP
        </h1>
        <div className="editorial-rule my-6" />
        <p className="mb-4 text-base leading-relaxed text-neutral-gray">
          O <strong className="text-neutral-black">Kraken MCP Server</strong> é um servidor remoto{" "}
          <a
            href="https://modelcontextprotocol.io/"
            className="text-brand-purple underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Model Context Protocol
          </a>{" "}
          integrado na app Kraken. Permite que LLMs (Claude, ChatGPT, etc.) listem contas Meta,
          pesquisem segmentação, sincronizem configuração e publiquem campanhas.
        </p>
        <h2 className="mb-3 font-display text-lg font-semibold text-neutral-black">
          Pré-requisitos
        </h2>
        <ul className="mb-6 list-inside list-disc space-y-2 text-sm text-neutral-gray">
          <li>Conta Kraken com token Meta conectado</li>
          <li>App Meta configurado em Configurações → App Meta (Developer)</li>
          <li>Chave MCP gerada em Configurações → Acesso MCP (LLMs)</li>
          <li>Migração Supabase <code className="rounded bg-black/5 px-1 font-mono text-xs">mcp_api_keys</code> aplicada</li>
        </ul>
        <p className="text-sm text-neutral-gray">
          Já tem conta?{" "}
          <Link href="/configuracoes" className="font-medium text-brand-purple hover:underline">
            Abrir Configurações → Acesso MCP
          </Link>
        </p>
      </section>

      {/* 2. Instalação */}
      <section id="instalacao" className="scroll-mt-24 mb-16">
        <h2 className="mb-4 font-display text-2xl font-semibold text-neutral-black">Instalação</h2>

        <div className="mb-8 space-y-6">
          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
            <h3 className="mb-2 font-display text-lg font-semibold text-neutral-black">
              Claude Desktop
            </h3>
            <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-neutral-gray">
              <li>Abra o ficheiro de configuração do Claude Desktop</li>
              <li>
                No macOS:{" "}
                <code className="rounded bg-black/5 px-1 font-mono text-xs">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
              </li>
              <li>Cole o snippet abaixo (substitua domínio e chave)</li>
              <li>Reinicie o Claude Desktop</li>
            </ol>
            <CodeBlock code={MCP_ENDPOINT_SNIPPETS.claudeDesktop} language="json" />
          </div>

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
            <h3 className="mb-2 font-display text-lg font-semibold text-neutral-black">
              Claude Code
            </h3>
            <p className="mb-4 text-sm text-neutral-gray">
              Adicione o servidor nas definições MCP do projeto ou use o mesmo JSON do Claude
              Desktop em <code className="font-mono text-xs">.mcp.json</code> na raiz do projeto.
            </p>
            <CodeBlock code={MCP_ENDPOINT_SNIPPETS.claudeDesktop} language="json" />
          </div>

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
            <h3 className="mb-2 font-display text-lg font-semibold text-neutral-black">
              ChatGPT (Remote MCP)
            </h3>
            <p className="mb-4 text-sm text-neutral-gray">
              Em clientes que suportam MCP remoto com headers HTTP personalizados, configure:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-neutral-gray">
              <li>
                URL: <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.production}</code>
              </li>
              <li>Header de autorização conforme abaixo</li>
            </ul>
            <CodeBlock code={MCP_ENDPOINT_SNIPPETS.authHeader} language="http" />
          </div>

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
            <h3 className="mb-2 font-display text-lg font-semibold text-neutral-black">
              MCP Inspector (teste local)
            </h3>
            <p className="mb-4 text-sm text-neutral-gray">
              Para validar a ligação em desenvolvimento:
            </p>
            <CodeBlock
              code={`npm run dev\nnpx @modelcontextprotocol/inspector`}
              language="bash"
            />
            <p className="mt-4 text-sm text-neutral-gray">
              Aponte o inspector para{" "}
              <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.local}</code> e defina o
              Bearer key.
            </p>
          </div>
        </div>

        <h3 className="mb-2 text-sm font-semibold text-neutral-black">Endpoints</h3>
        <div className="overflow-x-auto rounded-card border border-neutral-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-black/[0.02] text-left text-xs uppercase text-neutral-gray">
                <th className="px-4 py-2 font-medium">Ambiente</th>
                <th className="px-4 py-2 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-border/60">
                <td className="px-4 py-2 text-neutral-black">Local</td>
                <td className="px-4 py-2 font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.local}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-neutral-black">Produção</td>
                <td className="px-4 py-2 font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.production}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Autenticação */}
      <section id="autenticacao" className="scroll-mt-24 mb-16">
        <h2 className="mb-4 font-display text-2xl font-semibold text-neutral-black">
          Autenticação
        </h2>
        <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
          <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-neutral-gray">
            <li>
              Em{" "}
              <Link href="/configuracoes" className="text-brand-purple hover:underline">
                Configurações → Acesso MCP (LLMs)
              </Link>
              , clique em <strong>Gerar chave</strong>
            </li>
            <li>Copie o valor <code className="font-mono text-xs">kr_mcp_…</code> (mostrado uma vez)</li>
            <li>Envie em todas as requisições MCP:</li>
          </ol>
          <CodeBlock code={MCP_ENDPOINT_SNIPPETS.authHeader} language="http" />
          <p className="mt-4 text-sm text-neutral-gray">
            Chaves inválidas ou revogadas recebem resposta <strong>401 Unauthorized</strong>.
            Revogue imediatamente em Configurações se a chave for exposta.
          </p>
        </div>
      </section>

      {/* 4. Tools */}
      <section id="tools" className="scroll-mt-24 mb-16">
        <h2 className="mb-2 font-display text-2xl font-semibold text-neutral-black">
          Referência de Tools
        </h2>
        <p className="mb-6 text-sm text-neutral-gray">
          {MCP_DOCS_TOOLS.length} tools disponíveis. Todas as respostas são JSON em texto via MCP.
        </p>

        <div className="mb-8 overflow-x-auto rounded-card border border-neutral-border bg-white">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-neutral-border text-left text-xs uppercase text-neutral-gray">
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {MCP_DOCS_TOOLS.map((tool) => (
                <tr key={tool.name} className="border-b border-neutral-border/60 last:border-0">
                  <td className="px-4 py-2">
                    <a
                      href={`#tool-${tool.name}`}
                      className="font-mono text-xs text-brand-purple hover:underline"
                    >
                      {tool.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-neutral-gray">{tool.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {TOOLS_BY_CATEGORY.map((category) => {
          const tools = MCP_DOCS_TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;
          return (
            <div key={category} className="mb-10">
              <h3 className="mb-4 font-display text-lg font-semibold text-neutral-black">
                {category}
              </h3>
              <div className="flex flex-col gap-4">
                {tools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. Publish flow */}
      <section id="publish-flow" className="scroll-mt-24 mb-16">
        <h2 className="mb-4 font-display text-2xl font-semibold text-neutral-black">
          Fluxo de Publicação
        </h2>
        <p className="mb-6 text-sm text-neutral-gray">
          Sequência recomendada para uma LLM publicar campanhas no Meta via Kraken:
        </p>
        <ol className="space-y-4">
          {PUBLISH_FLOW_STEPS.map((item) => (
            <li
              key={item.step}
              className="flex gap-4 rounded-card border border-neutral-border bg-white p-4 shadow-subtle"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple-subtle font-display text-sm font-semibold text-brand-purple">
                {item.step}
              </span>
              <div>
                <p className="font-mono text-sm font-semibold text-brand-purple">{item.tool}</p>
                <p className="mt-1 text-sm text-neutral-gray">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-card border border-semantic-yellow/30 bg-semantic-yellow-bg p-4 text-sm text-neutral-black">
          <strong>Nota:</strong> publicações grandes podem devolver{" "}
          <code className="font-mono text-xs">deferred: true</code> — a execução continua em
          segundo plano. Use <code className="font-mono text-xs">get_publish_status(jobId)</code>{" "}
          até o status ser terminal (<code className="font-mono text-xs">done</code> ou{" "}
          <code className="font-mono text-xs">error</code>).
        </div>
      </section>

      {/* 6. Segurança */}
      <section id="seguranca" className="scroll-mt-24">
        <h2 className="mb-4 font-display text-2xl font-semibold text-neutral-black">Segurança</h2>
        <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
          <ul className="list-inside list-disc space-y-3 text-sm text-neutral-gray">
            <li>
              Chaves MCP são armazenadas apenas como <strong>hash SHA-256</strong> — o valor
              completo nunca é guardado após a criação.
            </li>
            <li>
              O servidor usa service role internamente, mas <strong>todas as queries</strong> são
              filtradas pelo <code className="font-mono text-xs">user_id</code> da chave.
            </li>
            <li>
              <code className="font-mono text-xs">publish_campaign</code> exige{" "}
              <code className="font-mono text-xs">confirm: true</code> após{" "}
              <code className="font-mono text-xs">prepare_campaign</code>.
            </li>
            <li>
              Revogue chaves comprometidas em{" "}
              <Link href="/configuracoes" className="text-brand-purple hover:underline">
                Configurações → Acesso MCP
              </Link>
              .
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
