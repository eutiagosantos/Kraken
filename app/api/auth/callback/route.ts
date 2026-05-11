import { type NextRequest, NextResponse } from "next/server";

import { syncMetaAdAccountsForUser } from "@/lib/meta/sync-ad-accounts";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeInternalPath(next: string | null): string {
  const fallback = "/home";
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"));
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const providerToken = session?.provider_token;
  if (providerToken && session?.user?.id) {
    const tokenExpiresAtIso =
      session.expires_at != null
        ? new Date(session.expires_at * 1000).toISOString()
        : null;
    await syncMetaAdAccountsForUser(
      supabase,
      session.user.id,
      providerToken,
      tokenExpiresAtIso
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
