import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import { countMetaAdAccountsForUser } from "@/libs/database/queries/meta-ad-accounts";
import { getMetaUserToken } from "@/libs/database/queries/meta-user-tokens";
import {
  deleteUserMetaAppForUser,
  getUserMetaAppIdForUser,
  upsertUserMetaApp,
} from "@/libs/database/queries/user-meta-apps";
import { postgresErrorMessage } from "@/libs/database/postgres-error";
import { encryptAppSecret, getEncryptionKeyError, isEncryptionConfigured } from "@/libs/meta/app-credentials-crypto";

const postBodySchema = z.object({
  appId: z.string().trim().min(1).max(64),
  appSecret: z.string().trim().min(1).max(512),
});

export async function GET() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  try {
    const [appResult, tokenResult, connectedAccounts] = await Promise.all([
      getUserMetaAppIdForUser(user.id),
      getMetaUserToken(user.id),
      countMetaAdAccountsForUser(user.id),
    ]);

    return NextResponse.json({
      configured: Boolean(appResult?.meta_app_id),
      appId: appResult?.meta_app_id ?? null,
      hasAccessToken: Boolean(tokenResult?.access_token),
      connectedAccounts,
    });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

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
  try {
    await upsertUserMetaApp({
      userId: user.id,
      metaAppId: parsed.data.appId,
      metaAppSecretEncrypted: encryptedSecret,
      now,
    });
    return NextResponse.json({ ok: true, appId: parsed.data.appId });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  try {
    await deleteUserMetaAppForUser(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
