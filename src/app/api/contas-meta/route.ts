import { NextResponse } from "next/server";
import { z } from "zod";

import { devLogRouteMs } from "@/libs/api/dev-route-timing";
import { getSessionUser } from "@/libs/api/session";
import { upsertMetaUserToken } from "@/libs/database/queries/meta-user-tokens";
import {
  getCachedContasMetaRows,
  invalidateUserDataShortCache,
  setCachedContasMetaRows,
} from "@/libs/api/user-data-short-cache";
import { rowToContaMeta } from "@/libs/contas-meta-map";
import { listMetaAdAccountsForUser } from "@/libs/database/queries/meta-ad-accounts";
import { fetchGraphAdAccounts } from "@/libs/meta/graph-ad-accounts";
import { inspectTokenScopes } from "@/libs/meta/graph-inspect-token";
import { resolveMetaAppCredentials } from "@/libs/meta/resolve-app-credentials";
import { invalidatePageCache } from "@/libs/meta/graph-user-pages";
import { syncMetaAdAccountsForUser } from "@/libs/meta/sync-ad-accounts";

const postBodySchema = z.union([
  z.object({ action: z.literal("sync") }),
  z.object({ action: z.literal("inspect_token"), token: z.string().min(10) }),
  z.object({ action: z.literal("sync_with_token"), token: z.string().min(10) }),
]);

export async function GET() {
  const startedAt = Date.now();
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let rows = getCachedContasMetaRows(user.id);
  if (!rows) {
    try {
      rows = await listMetaAdAccountsForUser(user.id);
      setCachedContasMetaRows(user.id, rows);
    } catch (e) {
      devLogRouteMs("GET /api/contas-meta (error)", startedAt);
      const message = e instanceof Error ? e.message : "query_failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  devLogRouteMs("GET /api/contas-meta", startedAt);
  return NextResponse.json({ data: rows.map(rowToContaMeta) });
}

export async function POST(request: Request) {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const metaAppCredentials = await resolveMetaAppCredentials(user.id);

  if (parsed.data.action === "inspect_token") {
    try {
      const [accounts, scopeResult] = await Promise.all([
        fetchGraphAdAccounts(parsed.data.token),
        inspectTokenScopes(parsed.data.token, { credentials: metaAppCredentials }),
      ]);
      if (accounts.length === 0) {
        return NextResponse.json(
          { error: "Este token não tem acesso a nenhuma conta de anúncios." },
          { status: 400 }
        );
      }
      const missingScopes = scopeResult.valid ? scopeResult.missingScopes : [];
      return NextResponse.json({ ok: true, accounts, missingScopes });
    } catch (e) {
      const message = e instanceof Error ? e.message : "inspect_failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (parsed.data.action === "sync") {
    return NextResponse.json(
      {
        error:
          "Sincronização via sessão OAuth não está disponível com Clerk. Use «Reconectar conta» com um token Meta (sync_with_token).",
      },
      { status: 400 }
    );
  }

  if (parsed.data.action === "sync_with_token") {
    const token = parsed.data.token;
    const scopeResult = await inspectTokenScopes(token, { credentials: metaAppCredentials });
    if (!scopeResult.valid) {
      return NextResponse.json({ error: scopeResult.error }, { status: 400 });
    }
    if (scopeResult.missingScopes.length > 0) {
      return NextResponse.json(
        {
          error: `O token não inclui as permissões necessárias: ${scopeResult.missingScopes.join(", ")}. Gere um token com estes scopes no Graph API Explorer ou reconecte.`,
          missingScopes: scopeResult.missingScopes,
        },
        { status: 400 }
      );
    }
    try {
      await upsertMetaUserToken(user.id, token, null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "token_save_failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const result = await syncMetaAdAccountsForUser(user.id, token, null);
    if (result.error) {
      return NextResponse.json({ error: result.error, synced: result.synced }, { status: 502 });
    }
    invalidatePageCache(token);
    invalidateUserDataShortCache(user.id);
    return NextResponse.json({ ok: true, synced: result.synced });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
