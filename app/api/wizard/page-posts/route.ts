import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import {
  inspectTokenScopes,
  REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS,
  validatePastedPageAccessToken,
} from "@/lib/meta/graph-inspect-token";
import { clampPagePostsLimit, fetchPagePostsWithEngagement } from "@/lib/meta/graph-page-posts";
import { enrichPostsWithLifetimeInsights } from "@/lib/meta/graph-post-insights";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import {
  fetchUserFacebookPages,
  pageIdInUserPages,
  resolvePageAccessTokenForPosts,
} from "@/lib/meta/graph-user-pages";

export const dynamic = "force-dynamic";

async function respondPagePosts(
  supabase: SupabaseClient,
  userId: string,
  pageId: string,
  limit: number,
  pastedPageAccessToken?: string
): Promise<NextResponse> {
  const tokenRes = await getMetaGraphAccessToken(supabase, userId);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  try {
    const pages = await fetchUserFacebookPages(tokenRes.accessToken);
    if (!pageIdInUserPages(pageId, pages)) {
      return NextResponse.json(
        { error: "Esta página não está na lista de Páginas que a sua conta Meta gere. Escolha outra." },
        { status: 403 }
      );
    }

    let pageAccessToken: string;
    const trimmedPaste = pastedPageAccessToken?.trim();

    if (trimmedPaste) {
      const pasted = await validatePastedPageAccessToken(trimmedPaste, pageId);
      if (!pasted.ok) {
        const status = pasted.code === "DEBUG_TOKEN_CONFIG" ? 503 : 403;
        return NextResponse.json({ error: pasted.error, code: pasted.code }, { status });
      }
      if (pasted.missingBaseScopes.length > 0) {
        return NextResponse.json(
          {
            error: `O token colado não inclui as permissões necessárias: ${pasted.missingBaseScopes.join(", ")}.`,
            code: "PAGE_TOKEN_SCOPE_MISSING",
            missingScopes: pasted.missingBaseScopes,
          },
          { status: 403 }
        );
      }
      pageAccessToken = trimmedPaste;
    } else {
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
              "A Meta não devolveu um token de página para esta Página (resposta de /me/accounts sem access_token). Reconecte a conta Meta em Contas Meta e aceite as permissões de Página, cole um Page token do Explorador da Graph API (abaixo) ou confirme no Access Token Debugger que o token inclui pages_read_engagement, pages_read_user_content e pages_manage_ads.",
            code: "PAGE_ACCESS_TOKEN_UNAVAILABLE",
          },
          { status: 403 }
        );
      }
      pageAccessToken = resolved.pageAccessToken;
    }

    const pageScopeCheck = await inspectTokenScopes(pageAccessToken, {
      requiredScopes: REQUIRED_PAGE_TOKEN_SCOPES_FOR_ENGAGEMENT_POSTS,
    });
    if (!pageScopeCheck.valid) {
      return NextResponse.json({ error: pageScopeCheck.error }, { status: 400 });
    }
    if (pageScopeCheck.missingScopes.length > 0) {
      return NextResponse.json(
        {
          error: `O token da Página não inclui as permissões necessárias: ${pageScopeCheck.missingScopes.join(", ")}. Reconecte a conta Meta em Contas Meta ou use um token do Explorador com os scopes certos.`,
          code: "PAGE_TOKEN_SCOPE_MISSING",
          missingScopes: pageScopeCheck.missingScopes,
        },
        { status: 403 }
      );
    }

    let data = await fetchPagePostsWithEngagement(pageAccessToken, pageId, limit);

    const canInsights =
      pageScopeCheck.valid &&
      pageScopeCheck.scopes.length > 0 &&
      pageScopeCheck.scopes.includes("read_insights");
    if (canInsights) {
      data = await enrichPostsWithLifetimeInsights(pageAccessToken, data);
    }

    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível carregar as publicações da página.";
    const lower = message.toLowerCase();
    const isPermissionError =
      lower.includes("pages_read_engagement") ||
      lower.includes("pages_read_user_content") ||
      lower.includes("read_insights") ||
      lower.includes("(#10)") ||
      lower.includes("(#200)");
    if (isPermissionError) {
      return NextResponse.json(
        {
          error:
            "Faltam permissões de Página no token (ex.: pages_read_engagement, pages_read_user_content ou read_insights para métricas). Reconecte a conta Meta em Contas Meta e aceite os novos scopes.",
          code: "META_GRAPH_PERMISSION",
          detail: message,
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

  return respondPagePosts(supabase, user.id, pageId, limit, undefined);
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const pageId = typeof raw.pageId === "string" ? raw.pageId.trim() : "";
  if (!pageId) {
    return NextResponse.json({ error: "Indique pageId no corpo JSON." }, { status: 400 });
  }

  const limitRaw = raw.limit;
  const limitNum =
    typeof limitRaw === "number"
      ? limitRaw
      : limitRaw != null && limitRaw !== ""
        ? Number(limitRaw)
        : undefined;
  const limit = clampPagePostsLimit(Number.isFinite(limitNum) ? limitNum : undefined);

  const pageAccessToken =
    typeof raw.pageAccessToken === "string" && raw.pageAccessToken.trim()
      ? raw.pageAccessToken.trim()
      : undefined;

  return respondPagePosts(supabase, user.id, pageId, limit, pageAccessToken);
}
