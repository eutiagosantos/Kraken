"use client";

import { Check, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useSuccessFeedback } from "@/components/app/ui/SuccessFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMcpKeys } from "@/lib/hooks/useMcpKeys";

function formatLastUsed(iso: string | null): string {
  if (!iso) return "Nunca";
  try {
    return new Date(iso).toLocaleString("pt-PT");
  } catch {
    return iso;
  }
}

function buildConnectorSnippet(mcpUrl: string, bearerKey: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        kraken: {
          url: mcpUrl,
          headers: {
            Authorization: `Bearer ${bearerKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function McpKeysPanel() {
  const { keys, loading, refetch } = useMcpKeys();
  const { showSuccess } = useSuccessFeedback();

  const [keyName, setKeyName] = useState("");
  const [minting, setMinting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintedPlaintext, setMintedPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState<"key" | "snippet" | null>(null);

  const mcpBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp`
      : "https://kraken-sigma-three.vercel.app/api/mcp";

  const copyText = useCallback(async (text: string, kind: "key" | "snippet") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Não foi possível copiar para a área de transferência.");
    }
  }, []);

  const onMint = async () => {
    setMinting(true);
    setError(null);
    setMintedPlaintext(null);
    try {
      const res = await fetch("/api/user/mcp-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() || undefined }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: { plaintext?: string };
      };
      if (!res.ok) {
        setError(body.error || "Não foi possível gerar a chave.");
        return;
      }
      if (body.data?.plaintext) {
        setMintedPlaintext(body.data.plaintext);
        setKeyName("");
        await refetch();
        showSuccess("Chave MCP criada. Copie-a agora — não será mostrada novamente.");
      }
    } catch {
      setError("Erro de rede ao gerar chave.");
    } finally {
      setMinting(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!window.confirm("Revogar esta chave? Clientes MCP deixarão de funcionar imediatamente.")) {
      return;
    }
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/user/mcp-keys/${id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Não foi possível revogar a chave.");
        return;
      }
      await refetch();
      showSuccess("Chave revogada.");
    } catch {
      setError("Erro de rede ao revogar chave.");
    } finally {
      setRevokingId(null);
    }
  };

  const snippet =
    mintedPlaintext != null ? buildConnectorSnippet(mcpBaseUrl, mintedPlaintext) : null;

  return (
    <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
      <header className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-neutral-black">
          Acesso MCP (LLMs)
        </h2>
        <p className="mt-0.5 text-sm text-neutral-silver">
          Gere chaves API para conectar Claude, ChatGPT ou outros clientes MCP ao Kraken e publicar
          campanhas Meta por conversa.{" "}
          <Link
            href="/docs/mcp"
            className="inline-flex items-center gap-1 font-medium text-brand-purple transition hover:underline"
          >
            Ver documentação MCP
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-gray">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          A carregar…
        </div>
      ) : (
        <>
          {keys.length > 0 ? (
            <ul className="mb-5 divide-y divide-neutral-border rounded-lg border border-neutral-border">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-black">{k.name}</p>
                    <p className="font-mono text-xs text-neutral-gray">
                      {k.key_prefix}… · último uso: {formatLastUsed(k.last_used_at)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={revokingId === k.id}
                    onClick={() => void onRevoke(k.id)}
                    aria-label={`Revogar ${k.name}`}
                  >
                    {revokingId === k.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">Revogar</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-neutral-gray">Nenhuma chave ativa.</p>
          )}

          <div className="flex max-w-md flex-col gap-3">
            <Input
              id="mcp-key-name"
              label="Nome da chave (opcional)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Ex.: Claude Desktop"
            />
            <Button type="button" disabled={minting} onClick={() => void onMint()}>
              {minting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  A gerar…
                </>
              ) : (
                "Gerar chave"
              )}
            </Button>
          </div>

          {mintedPlaintext ? (
            <div className="mt-5 space-y-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-medium text-amber-900">
                Copie a chave agora — não será mostrada novamente.
              </p>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-gray">Chave API</p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="break-all rounded bg-neutral-white px-2 py-1 text-xs">
                    {mintedPlaintext}
                  </code>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyText(mintedPlaintext, "key")}
                  >
                    {copied === "key" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2">Copiar chave</span>
                  </Button>
                </div>
              </div>
              {snippet ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-gray">
                    Configuração do conector (URL + Bearer)
                  </p>
                  <pre className="max-h-48 overflow-auto rounded bg-neutral-white p-3 text-xs">
                    {snippet}
                  </pre>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => void copyText(snippet, "snippet")}
                  >
                    {copied === "snippet" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2">Copiar configuração</span>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
