import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";
import { encryptAppSecret, getEncryptionKeyError, isEncryptionConfigured } from "@/lib/meta/app-credentials-crypto";

const postBodySchema = z.object({
  appId: z.string().trim().min(1).max(64),
  appSecret: z.string().trim().min(1).max(512),
});

export async function GET() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const [appResult, tokenResult, accountsResult] = await Promise.all([
    supabase.from("user_meta_apps").select("meta_app_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("meta_user_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("meta_ad_accounts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  if (appResult.error) {
    return NextResponse.json({ error: appResult.error.message }, { status: 500 });
  }
  if (tokenResult.error) {
    return NextResponse.json({ error: tokenResult.error.message }, { status: 500 });
  }
  if (accountsResult.error) {
    return NextResponse.json({ error: accountsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: Boolean(appResult.data?.meta_app_id),
    appId: appResult.data?.meta_app_id ?? null,
    hasAccessToken: Boolean(tokenResult.data?.access_token),
    connectedAccounts: accountsResult.count ?? 0,
  });
}

export async function POST(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  if (!isEncryptionConfigured()) {
    return NextResponse.json(
      {
        error:
          "KRAKEN_ENCRYPTION_KEY em falta no servidor. Se já foi configurada na Vercel, faça redeploy de Production.",
      },
      { status: 503 }
    );
  }

  const keyError = getEncryptionKeyError();
  if (keyError) {
    return NextResponse.json({ error: keyError }, { status: 503 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "App ID e App Secret são obrigatórios." }, { status: 400 });
  }

  let encryptedSecret: string;
  try {
    encryptedSecret = encryptAppSecret(parsed.data.appSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "encryption_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("user_meta_apps").upsert(
    {
      user_id: user.id,
      meta_app_id: parsed.data.appId,
      meta_app_secret_encrypted: encryptedSecret,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appId: parsed.data.appId });
}

export async function DELETE() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const { error } = await supabase.from("user_meta_apps").delete().eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
