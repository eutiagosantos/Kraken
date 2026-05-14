import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import { clampPagePostsLimit, fetchPagePostsWithEngagement } from "@/lib/meta/graph-page-posts";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { fetchUserFacebookPages, pageIdInUserPages } from "@/lib/meta/graph-user-pages";

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

  try {
    const pages = await fetchUserFacebookPages(tokenRes.accessToken);
    const matchedPage = pages.find((p) => p.id === pageId.trim());
    if (!matchedPage) {
      return NextResponse.json(
        { error: "Esta página não está na lista de Páginas que a sua conta Meta gere. Escolha outra." },
        { status: 403 }
      );
    }
    const effectiveToken = matchedPage.pageAccessToken ?? tokenRes.accessToken;
    const data = await fetchPagePostsWithEngagement(effectiveToken, pageId, limit);
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
        { error: "Permissão pages_read_engagement em falta. Reconecte a conta Meta (Contas Meta) para conceder essa permissão." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
