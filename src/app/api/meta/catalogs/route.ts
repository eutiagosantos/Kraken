import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/api/session";
import { graphListOwnedProductCatalogs } from "@/lib/meta/catalog-graph";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { inspectTokenScopes, REQUIRED_TOKEN_SCOPES_FOR_CATALOG } from "@/lib/meta/graph-inspect-token";

const getQuery = z.object({
  businessId: z.string().min(1),
});

const postBody = z.object({
  workspaceId: z.string().uuid().nullable().optional(),
  metaAdAccountId: z.string().uuid().nullable().optional(),
  businessId: z.string().min(1),
  metaCatalogId: z.string().min(1),
  name: z.string().min(1).max(512),
});

export async function GET(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const q = getQuery.safeParse({ businessId: url.searchParams.get("businessId") ?? "" });
  if (!q.success) {
    return NextResponse.json({ error: "Query businessId é obrigatório." }, { status: 400 });
  }

  const tok = await getMetaGraphAccessToken(supabase, user.id);
  if ("error" in tok) return NextResponse.json({ error: tok.error }, { status: 400 });

  const scopes = await inspectTokenScopes(tok.accessToken, { requiredScopes: REQUIRED_TOKEN_SCOPES_FOR_CATALOG });
  if (!scopes.valid) return NextResponse.json({ error: scopes.error }, { status: 400 });
  if (scopes.missingScopes.length > 0) {
    return NextResponse.json(
      { error: "Faltam permissões no token Meta.", missingScopes: scopes.missingScopes },
      { status: 403 }
    );
  }

  try {
    const catalogs = await graphListOwnedProductCatalogs({
      businessId: q.data.businessId,
      accessToken: tok.accessToken,
    });
    return NextResponse.json({ data: catalogs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "graph_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = postBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const tok = await getMetaGraphAccessToken(supabase, user.id);
  if ("error" in tok) return NextResponse.json({ error: tok.error }, { status: 400 });

  const scopes = await inspectTokenScopes(tok.accessToken, { requiredScopes: REQUIRED_TOKEN_SCOPES_FOR_CATALOG });
  if (!scopes.valid) return NextResponse.json({ error: scopes.error }, { status: 400 });
  if (scopes.missingScopes.length > 0) {
    return NextResponse.json(
      { error: "Faltam permissões no token Meta.", missingScopes: scopes.missingScopes },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("meta_catalogs").insert({
    user_id: user.id,
    workspace_id: parsed.data.workspaceId ?? null,
    meta_ad_account_id: parsed.data.metaAdAccountId ?? null,
    business_id: parsed.data.businessId,
    meta_catalog_id: parsed.data.metaCatalogId,
    name: parsed.data.name,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este catálogo já está guardado." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
