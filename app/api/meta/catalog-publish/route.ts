import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

import { getSessionUser } from "@/lib/api/session";
import { fetchUserFacebookPages, pageIdInUserPages } from "@/lib/meta/graph-user-pages";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { inspectTokenScopes, REQUIRED_TOKEN_SCOPES_FOR_CATALOG } from "@/lib/meta/graph-inspect-token";
import { catalogPublishPayloadSchema } from "@/lib/meta/catalog-publish-payload";
import { normalizeActId } from "@/lib/meta/graph-campaign-publish";
import { runCatalogPublish } from "@/lib/meta/publish-catalog-campaigns";

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
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = catalogPublishPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const tok = await getMetaGraphAccessToken(supabase, user.id);
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

  const { data: accRows, error: accErr } = await supabase
    .from("meta_ad_accounts")
    .select("meta_account_id,name")
    .eq("user_id", user.id);

  if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 });

  const accounts = orderSelectedAccounts(parsed.data.selectedAccountIds, accRows ?? []);
  if (accounts.length === 0) {
    return NextResponse.json({ error: "Nenhuma conta de anúncios válida para os IDs selecionados." }, { status: 400 });
  }

  try {
    const { results, warnings } = await runCatalogPublish({
      supabase,
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
