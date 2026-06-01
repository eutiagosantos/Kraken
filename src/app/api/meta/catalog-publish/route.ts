import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

import { getSessionUser } from "@/libs/api/session";
import { listMetaAdAccountsIdAndName } from "@/libs/database/queries/meta-ad-accounts";
import { fetchUserFacebookPages, pageIdInUserPages } from "@/libs/meta/graph-user-pages";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import { inspectTokenScopes, REQUIRED_TOKEN_SCOPES_FOR_CATALOG } from "@/libs/meta/graph-inspect-token";
import { catalogPublishPayloadSchema } from "@/libs/meta/catalog-publish-payload";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import { runCatalogPublish } from "@/libs/meta/publish-catalog-campaigns";

function orderSelectedAccounts(
  selectedRaw: string[],
  rows: Array<{ meta_account_id: string; name: string }>
): Array<{ meta_account_id: string; name: string }> {
  const byNorm = new Map(rows.map((r) => [normalizeActId(r.meta_account_id), r]));
  const seen = new Set<string>();
  const ordered: Array<{ meta_account_id: string; name: string }> = [];
  for (const raw of selectedRaw) {
    const n = normalizeActId(raw);
    if (seen.has(n)) continue;
    seen.add(n);
    const row = byNorm.get(n);
    if (row) ordered.push(row);
  }
  return ordered;
}

export async function POST(request: Request) {
  const { user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = catalogPublishPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const tok = await getMetaGraphAccessToken(user.id);
  if ("error" in tok) return NextResponse.json({ error: tok.error }, { status: 400 });

  const scopes = await inspectTokenScopes(tok.accessToken, { requiredScopes: REQUIRED_TOKEN_SCOPES_FOR_CATALOG });
  if (!scopes.valid) return NextResponse.json({ error: scopes.error }, { status: 400 });
  if (scopes.missingScopes.length > 0) {
    return NextResponse.json(
      { error: "Faltam permissões no token Meta (catalog_management).", missingScopes: scopes.missingScopes },
      { status: 403 }
    );
  }

  const pages = await fetchUserFacebookPages(tok.accessToken);
  if (!pageIdInUserPages(parsed.data.pageId, pages)) {
    return NextResponse.json({ error: "pageId não pertence às tuas páginas Facebook." }, { status: 400 });
  }

  let accRows;
  try {
    accRows = await listMetaAdAccountsIdAndName(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const accounts = orderSelectedAccounts(parsed.data.selectedAccountIds, accRows);
  if (accounts.length === 0) {
    return NextResponse.json({ error: "Nenhuma conta de anúncios válida para os IDs selecionados." }, { status: 400 });
  }

  try {
    const { results, warnings } = await runCatalogPublish({
      userId: user.id,
      accessToken: tok.accessToken,
      payload: parsed.data,
      accounts,
    });
    return NextResponse.json({ ok: true, results, warnings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "publish_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
