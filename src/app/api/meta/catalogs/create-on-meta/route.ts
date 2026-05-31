import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/api/session";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { inspectTokenScopes, REQUIRED_TOKEN_SCOPES_FOR_CATALOG } from "@/lib/meta/graph-inspect-token";
import { graphCreateOwnedProductCatalog } from "@/lib/meta/catalog-graph";

const postBody = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1).max(256),
  vertical: z.string().max(64).optional(),
});

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

  try {
    const created = await graphCreateOwnedProductCatalog({
      businessId: parsed.data.businessId,
      accessToken: tok.accessToken,
      name: parsed.data.name,
      vertical: parsed.data.vertical,
    });
    return NextResponse.json({ data: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "graph_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
