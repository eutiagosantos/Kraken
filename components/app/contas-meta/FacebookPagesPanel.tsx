"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AccountAvatar } from "@/components/app/contas-meta/AccountAvatar";
import { cn } from "@/lib/utils";

type FbPageRow = { id: string; name: string; pictureUrl?: string };

type PagePostRow = {
  id: string;
  message: string;
  createdTime: string;
  permalinkUrl: string | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  impressions: number | null;
  engagedUsers: number | null;
};

function formatPostDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function FacebookPagesPanel({
  onConnect,
  active,
  reloadKey = 0,
}: {
  onConnect: () => void;
  /** Quando falso, não pede à API (aba inativa). */
  active: boolean;
  /** Incrementar após reconectar Meta para voltar a pedir a lista. */
  reloadKey?: number;
}) {
  const [pages, setPages] = useState<FbPageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PagePostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  /** Optional Page access token from Graph API Explorer (same App as Kraken). */
  const [optionalPageToken, setOptionalPageToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wizard/pages", { credentials: "include" });
      const raw = (await res.json().catch(() => ({}))) as { error?: string; data?: FbPageRow[] };
      if (!res.ok) {
        throw new Error(typeof raw.error === "string" ? raw.error : `Pedido falhou (${res.status})`);
      }
      setPages(Array.isArray(raw.data) ? raw.data : []);
    } catch (e) {
      setPages([]);
      setError(e instanceof Error ? e.message : "Não foi possível carregar as páginas.");
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, []);

  const loadPosts = useCallback(async (pageId: string) => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const trimmed = optionalPageToken.trim();
      const res =
        trimmed.length > 0
          ? await fetch("/api/wizard/page-posts", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pageId, limit: 15, pageAccessToken: trimmed }),
            })
          : await fetch(
              `/api/wizard/page-posts?${new URLSearchParams({ pageId, limit: "15" }).toString()}`,
              { credentials: "include" }
            );
      const raw = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        data?: PagePostRow[];
      };
      if (!res.ok) {
        const msg =
          typeof raw.error === "string"
            ? raw.error
            : raw.code === "META_GRAPH_PERMISSION"
              ? "Permissão em falta no token Meta. Reconecte em Contas Meta."
              : `Pedido falhou (${res.status})`;
        throw new Error(msg);
      }
      setPosts(Array.isArray(raw.data) ? raw.data : []);
    } catch (e) {
      setPosts([]);
      setPostsError(e instanceof Error ? e.message : "Não foi possível carregar as publicações.");
    } finally {
      setPostsLoading(false);
    }
  }, [optionalPageToken]);

  useLayoutEffect(() => {
    if (active) setLoading(true);
  }, [active, reloadKey]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, reloadKey, load]);

  useEffect(() => {
    setSelectedPageId(null);
    setPosts([]);
    setPostsError(null);
    setOptionalPageToken("");
  }, [reloadKey]);

  useEffect(() => {
    if (selectedPageId && !pages.some((p) => p.id === selectedPageId)) {
      setSelectedPageId(null);
      setPosts([]);
      setPostsError(null);
      setOptionalPageToken("");
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    setOptionalPageToken("");
  }, [selectedPageId]);

  useEffect(() => {
    if (!active || !selectedPageId) return;
    void loadPosts(selectedPageId);
  }, [active, selectedPageId, loadPosts]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  if (!active) {
    return null;
  }

  if (loading || !loadedOnce) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-16 text-sm text-neutral-silver">
        <Loader2 className="h-10 w-10 shrink-0 animate-spin text-brand-purple" aria-hidden />
        <p>A carregar páginas Facebook…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashboard-border bg-white px-6 py-16 text-center">
        <p className="max-w-md text-sm text-semantic-red">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="subtle" onClick={() => void load()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="primary" onClick={onConnect}>
            Conectar Meta
          </Button>
        </div>
      </div>
    );
  }

  const selectedPage = selectedPageId ? pages.find((p) => p.id === selectedPageId) : undefined;

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-gray">
        Páginas que a sua identidade Meta gere (Graph API <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">me/accounts</code>
        ). Toque numa página para ver publicações recentes, partilhas e totais de reações e comentários (Graph{" "}
        <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">&#123;page-id&#125;/posts</code>
        ). Se <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">/me/accounts</code> não devolver{" "}
        <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">access_token</code> da página, pode colar um{" "}
        <strong className="font-medium text-neutral-black">Page access token</strong> gerado no{" "}
        <a
          href="https://developers.facebook.com/tools/explorer/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-purple underline-offset-2 hover:underline"
        >
          Explorador da Graph API
        </a>{" "}
        (em &quot;User or Page&quot; escolha a Página, gere o token e use a <strong className="font-medium text-neutral-black">mesma app</strong>{" "}
        que o Kraken). Com <code className="rounded bg-dashboard-track px-1 py-0.5 text-xs">read_insights</code> no token, mostramos também impressões e utilizadores envolvidos (lifetime) por publicação.
      </p>

      {pages.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-dashboard-border bg-dashboard-surface/50 px-6 py-14 text-center text-sm text-neutral-gray">
          <p>Nenhuma página encontrada com o token atual.</p>
          <p className="max-w-md text-xs text-neutral-silver">
            Confirme permissões <span className="font-medium">pages_show_list</span>,{" "}
            <span className="font-medium">pages_manage_ads</span>,{" "}
            <span className="font-medium">pages_read_engagement</span> e{" "}
            <span className="font-medium">pages_read_user_content</span> (Graph v25+; necessárias para ver publicações
            abaixo) e que gere pelo menos uma Página com a conta Facebook ligada ao Kraken. Para criar/editar posts na
            Página, inclua também <span className="font-medium">pages_manage_posts</span>.
          </p>
          <Button type="button" variant="primary" className="mt-1" onClick={onConnect}>
            Conectar ou reconectar Meta
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {pages.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border bg-white p-3 shadow-sm transition-shadow sm:gap-3 sm:p-4",
                  selectedPageId === p.id
                    ? "border-brand-purple ring-2 ring-brand-purple/35"
                    : "border-dashboard-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPageId(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
                >
                  {p.pictureUrl ? (
                    <img
                      src={p.pictureUrl}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <AccountAvatar name={p.name} size="md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-black">{p.name}</p>
                    <p className="truncate font-mono text-xs text-neutral-silver">{p.id}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void copyId(p.id)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashboard-border text-neutral-silver transition-colors hover:bg-dashboard-track hover:text-neutral-black",
                    copiedId === p.id && "border-semantic-green/40 text-semantic-green"
                  )}
                  title="Copiar ID da página"
                  aria-label={`Copiar ID ${p.id}`}
                >
                  {copiedId === p.id ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>

          {selectedPageId && selectedPage ? (
            <section
              className="mt-8 rounded-xl border border-dashboard-border bg-white p-4 shadow-sm sm:p-5"
              aria-labelledby="fb-page-posts-heading"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 id="fb-page-posts-heading" className="text-base font-semibold text-neutral-black">
                  Publicações recentes — {selectedPage.name}
                </h2>
                <Button type="button" variant="subtle" className="text-sm" onClick={() => void loadPosts(selectedPageId)}>
                  Atualizar
                </Button>
              </div>

              <div className="mb-5 rounded-lg border border-dashboard-border bg-dashboard-surface/60 p-3 sm:p-4">
                <label htmlFor="fb-optional-page-token" className="text-sm font-semibold text-neutral-black">
                  Token da Página (opcional)
                </label>
                <p className="mt-1 text-xs text-neutral-gray">
                  Só necessário se o token OAuth não trouxer <code className="rounded bg-white px-1">access_token</code> em{" "}
                  <code className="rounded bg-white px-1">/me/accounts</code>. Cole aqui o Page token da Página selecionada.
                </p>
                <textarea
                  id="fb-optional-page-token"
                  value={optionalPageToken}
                  onChange={(e) => setOptionalPageToken(e.target.value)}
                  onBlur={() => {
                    if (selectedPageId && optionalPageToken.trim()) void loadPosts(selectedPageId);
                  }}
                  placeholder="EAAG… (Page access token)"
                  rows={2}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-2 w-full resize-y rounded-lg border border-neutral-border bg-white px-3 py-2 font-mono text-xs text-neutral-black outline-none placeholder:text-neutral-silver focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25"
                />
              </div>

              {postsLoading ? (
                <div className="flex items-center gap-2 py-10 text-sm text-neutral-silver">
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand-purple" aria-hidden />
                  A carregar publicações…
                </div>
              ) : postsError ? (
                <div className="rounded-lg border border-semantic-yellow/40 bg-semantic-yellow-bg px-3 py-3 text-sm text-neutral-black">
                  <p className="font-medium text-semantic-red">Erro</p>
                  <p className="mt-1 text-neutral-gray">{postsError}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="subtle" className="px-3 py-2 text-sm" onClick={() => void loadPosts(selectedPageId)}>
                      Tentar novamente
                    </Button>
                    <Button type="button" variant="primary" className="px-3 py-2 text-sm" onClick={onConnect}>
                      Reconectar Meta
                    </Button>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <p className="py-6 text-sm text-neutral-gray">Nenhuma publicação devolvida para esta página.</p>
              ) : (
                <ul className="divide-y divide-dashboard-border">
                  {posts.map((post) => (
                    <li key={post.id} className="py-4 first:pt-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-silver">
                        {formatPostDate(post.createdTime)}
                      </p>
                      <p className="mt-1 line-clamp-4 text-sm text-neutral-black">
                        {post.message.trim() ? post.message : <span className="italic text-neutral-silver">(sem texto)</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-gray">
                        <span>
                          Reações: <strong className="text-neutral-black">{post.reactionCount}</strong>
                        </span>
                        <span>
                          Comentários: <strong className="text-neutral-black">{post.commentCount}</strong>
                        </span>
                        <span>
                          Partilhas: <strong className="text-neutral-black">{post.shareCount ?? 0}</strong>
                        </span>
                        {post.impressions != null ? (
                          <span>
                            Impressões: <strong className="text-neutral-black">{post.impressions}</strong>
                          </span>
                        ) : null}
                        {post.engagedUsers != null ? (
                          <span>
                            Envolvidos: <strong className="text-neutral-black">{post.engagedUsers}</strong>
                          </span>
                        ) : null}
                        {post.permalinkUrl ? (
                          <a
                            href={post.permalinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-brand-purple hover:underline"
                          >
                            Abrir no Facebook
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
