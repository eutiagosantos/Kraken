import { NextResponse } from "next/server";
import { z } from "zod";

import { devLogRouteMs } from "@/lib/api/dev-route-timing";
import { getSessionUser } from "@/lib/api/session";
import {
  getCachedContasMetaRows,
  invalidateUserDataShortCache,
  setCachedContasMetaRows,
} from "@/lib/api/user-data-short-cache";
import { rowToContaMeta } from "@/lib/contas-meta-map";
import { syncMetaAdAccountsForUser } from "@/lib/meta/sync-ad-accounts";

const postBodySchema = z.union([
  z.object({ action: z.literal("sync") }),
  z.object({ action: z.literal("sync_with_token"), token: z.string().min(10) }),
]);

export async function GET() {
  const startedAt = Date.now();
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let rows = getCachedContasMetaRows(user.id);
  if (!rows) {
    const { data, error } = await supabase
      .from("meta_ad_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false });

    if (error) {
      devLogRouteMs("GET /api/contas-meta (error)", startedAt);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rows = data ?? [];
    setCachedContasMetaRows(user.id, rows);
  }

  devLogRouteMs("GET /api/contas-meta", startedAt);
  return NextResponse.json({ data: rows.map(rowToContaMeta) });
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (parsed.data.action === "sync") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;
    if (!providerToken) {
      return NextResponse.json(
        { error: "Sem token Meta na sessão. Entre com Meta ou reconecte." },
        { status: 400 }
      );
    }
    const tokenExpiresAtIso =
      session.expires_at != null
        ? new Date(session.expires_at * 1000).toISOString()
        : null;
    const result = await syncMetaAdAccountsForUser(
      supabase,
      user.id,
      providerToken,
      tokenExpiresAtIso
    );
    if (result.error) {
      return NextResponse.json({ error: result.error, synced: result.synced }, { status: 502 });
    }
    invalidateUserDataShortCache(user.id);
    return NextResponse.json({ ok: true, synced: result.synced });
  }

  if (parsed.data.action === "sync_with_token") {
    const token = parsed.data.token;
    const { error: tokenErr } = await supabase.from("meta_user_tokens").upsert(
      {
        user_id: user.id,
        access_token: token,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (tokenErr) {
      return NextResponse.json({ error: tokenErr.message }, { status: 500 });
    }
    const result = await syncMetaAdAccountsForUser(supabase, user.id, token, null);
    if (result.error) {
      return NextResponse.json({ error: result.error, synced: result.synced }, { status: 502 });
    }
    invalidateUserDataShortCache(user.id);
    return NextResponse.json({ ok: true, synced: result.synced });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
