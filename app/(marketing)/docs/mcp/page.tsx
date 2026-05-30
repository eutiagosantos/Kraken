import Link from "next/link";
import { ArrowRight, Shield, Zap } from "lucide-react";
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

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className={id ? "scroll-mt-24" : undefined} id={id}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-black sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-gray">{description}</p>
      ) : null}
    </header>
  );
}

export default function McpDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20 sm:px-8 lg:py-12">
      {/* 1. Introdução */}
      <section id="intro" className="scroll-mt-24 mb-20">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-border/80 bg-white p-6 shadow-subtle sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-purple/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-brand-purple/5 blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-purple/15 bg-brand-purple-subtle/50 px-3 py-1 text-xs font-medium text-brand-purple">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Quick start · MCP remoto
            </div>

            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-purple">
              Kraken MCP
            </p>
            <h1 className="font-display text-display-md font-semibold text-neutral-black sm:text-display-lg">
              Documentação do Servidor MCP
            </h1>
            <div className="editorial-rule my-6 max-w-xs" />

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
            <ul className="mb-6 space-y-2 text-sm text-neutral-gray">
              {[
                "Conta Kraken com token Meta conectado",
                "App Meta configurado em Configurações → App Meta (Developer)",
                "Chave MCP gerada em Configurações → Acesso MCP (LLMs)",
                "Migração Supabase mcp_api_keys aplicada",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-2 rounded-btn bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-purple/90"
              >
                Criar chave API
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-gray transition hover:text-brand-purple"
              >
                Já tem conta? Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Instalação */}
      <section id="instalacao" className="scroll-mt-24 mb-20">
        <SectionHeading
          eyebrow="Setup"
          title="Instalação"
          description="Configure o conector em Claude Desktop, Claude Code, ChatGPT ou valide localmente com o MCP Inspector."
        />

        <div className="mt-8 space-y-5">
          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle transition hover:border-brand-purple/15">
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

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle transition hover:border-brand-purple/15">
            <h3 className="mb-2 font-display text-lg font-semibold text-neutral-black">
              Claude Code
            </h3>
            <p className="mb-4 text-sm text-neutral-gray">
              Adicione o servidor nas definições MCP do projeto ou use o mesmo JSON do Claude
              Desktop em <code className="font-mono text-xs">.mcp.json</code> na raiz do projeto.
            </p>
            <CodeBlock code={MCP_ENDPOINT_SNIPPETS.claudeDesktop} language="json" />
          </div>

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle transition hover:border-brand-purple/15">
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

          <div className="rounded-card border border-neutral-border bg-white p-5 shadow-subtle transition hover:border-brand-purple/15">
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

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-neutral-black">Endpoints</h3>
          <div className="overflow-hidden rounded-card border border-neutral-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-border bg-black/[0.02] text-left text-xs uppercase text-neutral-gray">
                  <th className="px-4 py-3 font-medium">Ambiente</th>
                  <th className="px-4 py-3 font-medium">URL</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-border/60">
                  <td className="px-4 py-3 font-medium text-neutral-black">Local</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-gray">
                    {MCP_ENDPOINT_SNIPPETS.local}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-black">Produção</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-gray">
                    {MCP_ENDPOINT_SNIPPETS.production}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Autenticação */}
      <section id="autenticacao" className="scroll-mt-24 mb-20">
        <SectionHeading
          eyebrow="Auth"
          title="Autenticação"
          description="Todas as requisições MCP exigem uma chave Bearer gerada em Configurações."
        />

        <div className="mt-8 rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
          <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-neutral-gray">
            <li>
              Em{" "}
              <Link href="/configuracoes" className="text-brand-purple hover:underline">
                Configurações → Acesso MCP (LLMs)
              </Link>
              , clique em <strong>Gerar chave</strong>
            </li>
            <li>
              Copie o valor <code className="font-mono text-xs">kr_mcp_…</code> (mostrado uma vez)
            </li>
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
      <section id="tools" className="scroll-mt-24 mb-20">
        <SectionHeading
          eyebrow="API Reference"
          title="Referência de Tools"
          description={`${MCP_DOCS_TOOLS.length} tools disponíveis. Todas as respostas são JSON em texto via MCP.`}
        />

        <div className="mt-8 overflow-hidden rounded-card border border-neutral-border bg-white">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-black/[0.02] text-left text-xs uppercase text-neutral-gray">
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {MCP_DOCS_TOOLS.map((tool) => (
                <tr
                  key={tool.name}
                  className="border-b border-neutral-border/60 transition last:border-0 hover:bg-brand-purple-subtle/30"
                >
                  <td className="px-4 py-2.5">
                    <a
                      href={`#tool-${tool.name}`}
                      className="font-mono text-xs text-brand-purple hover:underline"
                    >
                      {tool.name}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-gray">{tool.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {TOOLS_BY_CATEGORY.map((category, categoryIndex) => {
          const tools = MCP_DOCS_TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;
          return (
            <div key={category} className="mt-12">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-display text-2xl font-bold tabular-nums text-brand-purple/25">
                  {String(categoryIndex + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-semibold text-neutral-black">{category}</h3>
              </div>
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
      <section id="publish-flow" className="scroll-mt-24 mb-20">
        <SectionHeading
          eyebrow="Workflow"
          title="Fluxo de Publicação"
          description="Sequência recomendada para uma LLM publicar campanhas no Meta via Kraken."
        />

        <ol className="relative mt-8 space-y-0">
          {PUBLISH_FLOW_STEPS.map((item, index) => (
            <li key={item.step} className="relative flex gap-4 pb-8 last:pb-0">
              {index < PUBLISH_FLOW_STEPS.length - 1 ? (
                <span
                  className="absolute left-4 top-10 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-brand-purple/40 to-brand-purple/10"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-purple/20 bg-brand-purple-subtle font-display text-sm font-semibold text-brand-purple shadow-sm">
                {item.step}
              </span>
              <div className="min-w-0 flex-1 rounded-card border border-neutral-border bg-white p-4 shadow-subtle">
                <p className="font-mono text-sm font-semibold text-brand-purple">{item.tool}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-gray">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-card border border-semantic-yellow/30 bg-semantic-yellow-bg p-4 text-sm text-neutral-black">
          <strong>Nota:</strong> publicações grandes podem devolver{" "}
          <code className="font-mono text-xs">deferred: true</code> — a execução continua em
          segundo plano. Use <code className="font-mono text-xs">get_publish_status(jobId)</code>{" "}
          até o status ser terminal (<code className="font-mono text-xs">done</code> ou{" "}
          <code className="font-mono text-xs">error</code>).
        </div>
      </section>

      {/* 6. Segurança */}
      <section id="seguranca" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Security"
          title="Segurança"
          description="Boas práticas para proteger chaves MCP e dados da sua conta."
        />

        <div className="mt-8 rounded-card border border-neutral-border bg-white p-5 shadow-subtle">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-purple-subtle/50 px-3 py-1 text-xs font-medium text-brand-purple">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Proteção por utilizador
          </div>
          <ul className="space-y-3 text-sm text-neutral-gray">
            {[
              <>
                Chaves MCP são armazenadas apenas como <strong>hash SHA-256</strong> — o valor
                completo nunca é guardado após a criação.
              </>,
              <>
                O servidor usa service role internamente, mas <strong>todas as queries</strong> são
                filtradas pelo <code className="font-mono text-xs">user_id</code> da chave.
              </>,
              <>
                <code className="font-mono text-xs">publish_campaign</code> exige{" "}
                <code className="font-mono text-xs">confirm: true</code> após{" "}
                <code className="font-mono text-xs">prepare_campaign</code>.
              </>,
              <>
                Revogue chaves comprometidas em{" "}
                <Link href="/configuracoes" className="text-brand-purple hover:underline">
                  Configurações → Acesso MCP
                </Link>
                .
              </>,
            ].map((content, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple/60" />
                <span>{content}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
