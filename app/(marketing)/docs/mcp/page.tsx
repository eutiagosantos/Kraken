import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsCard } from "@/components/docs/DocsCard";
import { DocsStep, DocsSteps } from "@/components/docs/DocsSteps";
import { DocsTip } from "@/components/docs/DocsTip";
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
    <div className="mx-auto max-w-3xl px-4 py-10 pb-20 sm:px-8 lg:py-14">
      {/* 1. Introdução */}
      <section id="intro" className="scroll-mt-24 mb-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-black sm:text-4xl">
          Documentação do Servidor MCP
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-gray">
          Configure e utilize o servidor MCP do Kraken em Claude, ChatGPT e outras LLMs compatíveis
          para listar contas Meta, pesquisar segmentação e publicar campanhas.
        </p>

        <DocsTip className="mt-6">
          A <strong>chave MCP</strong> (<code className="font-mono text-xs">kr_mcp_…</code>) é a
          credencial de acesso ao servidor. Sem uma chave válida no header{" "}
          <code className="font-mono text-xs">Authorization</code>, nenhuma requisição será aceite.
        </DocsTip>

        <h2 className="mt-10 mb-3 font-display text-xl font-semibold text-neutral-black">
          Pré-requisitos
        </h2>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-neutral-gray">
          <li>Conta Kraken com token Meta conectado</li>
          <li>App Meta configurado em Configurações → App Meta (Developer)</li>
          <li>Chave MCP gerada em Configurações → Acesso MCP (LLMs)</li>
          <li>
            Migração Supabase{" "}
            <code className="rounded bg-black/[0.04] px-1 font-mono text-xs">mcp_api_keys</code>{" "}
            aplicada
          </li>
        </ul>

        <p className="mt-6 text-sm text-neutral-gray">
          Já tem conta?{" "}
          <Link href="/configuracoes" className="font-medium text-brand-purple hover:underline">
            Abrir Configurações → Acesso MCP
          </Link>
        </p>
      </section>

      <hr className="mb-16 border-neutral-border" />

      {/* 2. Instalação */}
      <section id="instalacao" className="scroll-mt-24 mb-16">
        <h2 className="font-display text-2xl font-semibold text-neutral-black">Instalação</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-gray">
          Configure o conector em Claude Desktop, Claude Code, ChatGPT ou valide localmente com o
          MCP Inspector.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-neutral-black">
              Claude Desktop
            </h3>
            <DocsCard title="Configuração">
              <ol className="mb-4 list-inside list-decimal space-y-2">
                <li>Abra o ficheiro de configuração do Claude Desktop</li>
                <li>
                  No macOS:{" "}
                  <code className="rounded bg-black/[0.04] px-1 font-mono text-xs">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </li>
                <li>Cole o snippet abaixo (substitua domínio e chave)</li>
                <li>Reinicie o Claude Desktop</li>
              </ol>
              <CodeBlock code={MCP_ENDPOINT_SNIPPETS.claudeDesktop} language="json" />
            </DocsCard>
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-neutral-black">
              Claude Code
            </h3>
            <DocsCard title="Configuração">
              <p className="mb-4">
                Adicione o servidor nas definições MCP do projeto ou use o mesmo JSON do Claude
                Desktop em <code className="font-mono text-xs">.mcp.json</code> na raiz do projeto.
              </p>
              <CodeBlock code={MCP_ENDPOINT_SNIPPETS.claudeDesktop} language="json" />
            </DocsCard>
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-neutral-black">
              ChatGPT (Remote MCP)
            </h3>
            <DocsCard title="Configuração">
              <p className="mb-4">
                Em clientes que suportam MCP remoto com headers HTTP personalizados, configure:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-1">
                <li>
                  URL:{" "}
                  <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.production}</code>
                </li>
                <li>Header de autorização conforme abaixo</li>
              </ul>
              <CodeBlock code={MCP_ENDPOINT_SNIPPETS.authHeader} language="http" />
            </DocsCard>
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-neutral-black">
              MCP Inspector (teste local)
            </h3>
            <DocsCard title="Smoke test">
              <p className="mb-4">Para validar a ligação em desenvolvimento:</p>
              <CodeBlock
                code={`npm run dev\nnpx @modelcontextprotocol/inspector`}
                language="bash"
              />
              <p className="mt-4">
                Aponte o inspector para{" "}
                <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.local}</code> e defina o
                Bearer key.
              </p>
            </DocsCard>
          </div>
        </div>

        <h3 className="mt-10 mb-3 text-sm font-semibold text-neutral-black">Endpoints</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-border">
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
      </section>

      <hr className="mb-16 border-neutral-border" />

      {/* 3. Autenticação */}
      <section id="autenticacao" className="scroll-mt-24 mb-16">
        <h2 className="font-display text-2xl font-semibold text-neutral-black">Autenticação</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-gray">
          Todas as requisições MCP exigem uma chave Bearer gerada em Configurações.
        </p>

        <DocsTip className="mt-6">
          Envie a chave em <strong>todas</strong> as requisições via header{" "}
          <code className="font-mono text-xs">Authorization: Bearer kr_mcp_…</code>. O valor
          completo só é mostrado uma vez no momento da criação.
        </DocsTip>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DocsCard title="Local vs Produção">
            <p className="mb-2">O mesmo endpoint MCP é usado em ambos os ambientes:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Local:{" "}
                <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.local}</code>
              </li>
              <li>
                Produção:{" "}
                <code className="font-mono text-xs">{MCP_ENDPOINT_SNIPPETS.production}</code>
              </li>
            </ul>
          </DocsCard>

          <DocsCard title="Erro de Autenticação (401)">
            <p>Receberá HTTP 401 quando:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>A chave não for enviada no header</li>
              <li>A chave estiver incorreta</li>
              <li>A chave tiver sido revogada</li>
            </ul>
          </DocsCard>
        </div>

        <h3 className="mt-10 mb-4 font-display text-lg font-semibold text-neutral-black">
          Como criar uma chave de API
        </h3>
        <DocsSteps>
          <DocsStep step={1} title="Acesse Configurações → Acesso MCP (LLMs)">
            <p>
              Abra{" "}
              <Link href="/configuracoes" className="text-brand-purple hover:underline">
                Configurações
              </Link>{" "}
              e localize a secção de chaves MCP.
            </p>
          </DocsStep>
          <DocsStep step={2} title="Clique em Gerar chave">
            <p>
              Opcionalmente dê um nome à chave (ex.: &quot;Claude Desktop&quot;) e confirme a
              criação.
            </p>
          </DocsStep>
          <DocsStep step={3} title="Copie a chave gerada" isLast>
            <p>
              Copie o valor <code className="font-mono text-xs">kr_mcp_…</code> e guarde num local
              seguro. Não será mostrado novamente.
            </p>
          </DocsStep>
        </DocsSteps>

        <p className="mt-6 mb-3 text-sm text-neutral-gray">
          Depois disso, envie em todas as requisições:
        </p>
        <CodeBlock code={MCP_ENDPOINT_SNIPPETS.authHeader} language="http" />

        <DocsCard title="Boas práticas de segurança" className="mt-8">
          <ul className="list-inside list-disc space-y-2">
            <li>Armazene as chaves em variáveis de ambiente ou gestor de segredos</li>
            <li>Nunca publique a chave em repositórios ou chats</li>
            <li>Revogue imediatamente qualquer chave que possa ter vazado</li>
            <li>
              Revogue em{" "}
              <Link href="/configuracoes" className="text-brand-purple hover:underline">
                Configurações → Acesso MCP
              </Link>
            </li>
          </ul>
        </DocsCard>
      </section>

      <hr className="mb-16 border-neutral-border" />

      {/* 4. Tools */}
      <section id="tools" className="scroll-mt-24 mb-16">
        <h2 className="font-display text-2xl font-semibold text-neutral-black">
          Referência de Tools
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-gray">
          {MCP_DOCS_TOOLS.length} tools disponíveis. Todas as respostas são JSON em texto via MCP.
        </p>

        <div className="mt-8 overflow-hidden rounded-xl border border-neutral-border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-black/[0.02] text-left text-xs uppercase text-neutral-gray">
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {MCP_DOCS_TOOLS.map((tool) => (
                <tr key={tool.name} className="border-b border-neutral-border/60 last:border-0">
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

        {TOOLS_BY_CATEGORY.map((category) => {
          const tools = MCP_DOCS_TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;
          return (
            <div key={category} className="mt-12">
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

      <hr className="mb-16 border-neutral-border" />

      {/* 5. Publish flow */}
      <section id="publish-flow" className="scroll-mt-24 mb-16">
        <h2 className="font-display text-2xl font-semibold text-neutral-black">
          Fluxo de Publicação
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-gray">
          Sequência recomendada para uma LLM publicar campanhas no Meta via Kraken.
        </p>

        <DocsSteps className="mt-8">
          {PUBLISH_FLOW_STEPS.map((item, index) => (
            <DocsStep
              key={item.step}
              step={item.step}
              title={item.tool}
              isLast={index === PUBLISH_FLOW_STEPS.length - 1}
            >
              {item.description}
            </DocsStep>
          ))}
        </DocsSteps>

        <DocsTip className="mt-8">
          Publicações grandes podem devolver{" "}
          <code className="font-mono text-xs">deferred: true</code> — a execução continua em segundo
          plano. Use <code className="font-mono text-xs">get_publish_status(jobId)</code> até o
          status ser terminal (<code className="font-mono text-xs">done</code> ou{" "}
          <code className="font-mono text-xs">error</code>).
        </DocsTip>
      </section>

      <hr className="mb-16 border-neutral-border" />

      {/* 6. Segurança */}
      <section id="seguranca" className="scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-neutral-black">Segurança</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-gray">
          Boas práticas para proteger chaves MCP e dados da sua conta.
        </p>

        <DocsCard title="Proteção por utilizador" className="mt-8">
          <ul className="list-inside list-disc space-y-2">
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
        </DocsCard>
      </section>
    </div>
  );
}
