import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import { inspectTokenScopes } from "@/lib/meta/graph-inspect-token";
import { clampPagePostsLimit, fetchPagePostsWithEngagement } from "@/lib/meta/graph-page-posts";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { fetchUserFacebookPages, resolvePageAccessTokenForPosts } from "@/lib/meta/graph-user-pages";

export async function GET(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId")?.trim() ?? "";
  if (!pageId) {
    return NextResponse.json({ error: "Indique o pageId (query)." }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const parsed =
    limitParam != null && limitParam !== "" ? Number(limitParam) : undefined;
  const limit = clampPagePostsLimit(Number.isFinite(parsed) ? parsed : undefined);

  const tokenRes = await getMetaGraphAccessToken(supabase, user.id);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  const scopeCheck = await inspectTokenScopes(tokenRes.accessToken);
  if (!scopeCheck.valid) {
    return NextResponse.json({ error: scopeCheck.error }, { status: 400 });
  }
  if (scopeCheck.missingScopes.length > 0) {
    return NextResponse.json(
      {
        error:
          "O token Meta guardado não inclui todas as permissões necessárias (incluindo pages_read_engagement). Reconecte a conta em Contas Meta ou volte a gerar o token com os scopes completos.",
        code: "META_SCOPE_MISSING",
        missingScopes: scopeCheck.missingScopes,
      },
      { status: 403 }
    );
  }

  try {
    const pages = await fetchUserFacebookPages(tokenRes.accessToken);
    const resolved = resolvePageAccessTokenForPosts(pages, pageId);
    if (!resolved.ok) {
      if (resolved.reason === "page_not_in_list") {
        return NextResponse.json(
          { error: "Esta página não está na lista de Páginas que a sua conta Meta gere. Escolha outra." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error:
            "A Meta não devolveu um token de página para esta Página (resposta de /me/accounts sem access_token). Reconecte a conta Meta em Contas Meta e aceite as permissões de Página, ou confirme no Access Token Debugger que o token inclui pages_read_engagement / pages_manage_ads.",
          code: "PAGE_ACCESS_TOKEN_UNAVAILABLE",
        },
        { status: 403 }
      );
    }
    const data = await fetchPagePostsWithEngagement(resolved.pageAccessToken, pageId, limit);
    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível carregar as publicações da página.";
    const lower = message.toLowerCase();
    const isPermissionError =
      lower.includes("pages_read_engagement") ||
      lower.includes("(#10)") ||
      lower.includes("(#200)");
    if (isPermissionError) {
      return NextResponse.json(
        {
          error:
            "Permissão pages_read_engagement em falta. Reconecte a conta Meta (Contas Meta) para conceder essa permissão.",
          code: "META_GRAPH_PERMISSION",
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
