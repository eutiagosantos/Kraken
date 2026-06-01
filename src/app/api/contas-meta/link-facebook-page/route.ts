import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidateUserDataShortCache } from "@/libs/api/user-data-short-cache";
import { getSessionUser } from "@/libs/api/session";
import {
  listOwnedMetaAccountIds,
  updateFacebookPageForMetaAccounts,
} from "@/libs/database/queries/meta-ad-accounts";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import { fetchUserFacebookPages, invalidatePageCache, pageIdInUserPages } from "@/libs/meta/graph-user-pages";

const bodySchema = z.object({
  pageId: z.string().min(1).max(64),
  metaAccountIds: z.array(z.string().min(1).max(64)).min(1).max(50),
});

export async function POST(request: Request) {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const pageId = parsed.data.pageId.trim();
  const uniqueActs = Array.from(
    new Set(parsed.data.metaAccountIds.map((id) => normalizeActId(id)))
  ).filter(Boolean);
  if (uniqueActs.length === 0) {
    return NextResponse.json({ error: "Indica pelo menos uma conta de anúncios." }, { status: 400 });
  }

  const tokenRes = await getMetaGraphAccessToken(user.id);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  let userPages;
  try {
    userPages = await fetchUserFacebookPages(tokenRes.accessToken);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível validar as páginas Facebook.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!pageIdInUserPages(pageId, userPages)) {
    return NextResponse.json(
      {
        error:
          "Este pageId não corresponde a nenhuma Página Facebook à qual a tua conta Meta tem acesso. Escolhe outra página ou reconecta o Meta.",
      },
      { status: 400 }
    );
  }

  const pageName =
    userPages.find((p) => p.id.trim() === pageId)?.name?.trim().slice(0, 512) ?? null;

  let owned: string[];
  try {
    owned = await listOwnedMetaAccountIds(user.id, uniqueActs);
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const ownedSet = new Set(owned);
  for (const act of uniqueActs) {
    if (!ownedSet.has(act)) {
      return NextResponse.json(
        { error: "Uma ou mais contas de anúncios não pertencem ao teu utilizador ou não existem." },
        { status: 403 }
      );
    }
  }

  const now = new Date().toISOString();
  try {
    await updateFacebookPageForMetaAccounts(user.id, uniqueActs, {
      facebook_page_id: pageId,
      facebook_page_name: pageName,
      updated_at: now,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  invalidateUserDataShortCache(user.id);
  invalidatePageCache(tokenRes.accessToken);
  return NextResponse.json({ ok: true, updated: uniqueActs.length });
}
