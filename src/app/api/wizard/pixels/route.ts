import { NextResponse } from "next/server";

import { getSessionUser } from "@/libs/api/session";
import { listMetaAccountIdsForUser } from "@/libs/database/queries/meta-ad-accounts";
import { graphJsonGet } from "@/libs/meta/graph-client";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import type { WizardPixel } from "@/libs/mock-data/wizard";

type AdsPixelsPage = {
  data?: Array<{ id?: string; name?: string }>;
  paging?: { cursors?: { after?: string } };
};

async function listPixelsForAct(options: {
  actId: string;
  accessToken: string;
}): Promise<Array<{ id: string; name: string }>> {
  const actPath = normalizeActId(options.actId);
  const out: Array<{ id: string; name: string }> = [];
  let after: string | undefined;
  for (let page = 0; page < 12; page++) {
    const searchParams: Record<string, string> = {
      fields: "id,name",
      limit: "100",
    };
    if (after) searchParams.after = after;
    const json = await graphJsonGet<AdsPixelsPage>({
      path: `${actPath}/adspixels`,
      accessToken: options.accessToken,
      searchParams,
    });
    for (const row of json.data ?? []) {
      const id = row.id?.trim();
      if (!id) continue;
      const name = row.name?.trim() || `Pixel ${id}`;
      out.push({ id, name });
    }
    after = json.paging?.cursors?.after;
    if (!after) break;
  }
  return out;
}

function parseAccountIdsParam(raw: string | null): string[] | null {
  if (!raw?.trim()) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : null;
}

export async function GET(request: Request) {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const tokenRes = await getMetaGraphAccessToken(user.id);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  const url = new URL(request.url);
  const fromQuery = parseAccountIdsParam(url.searchParams.get("accounts"));

  let accountIds: string[];
  if (fromQuery) {
    accountIds = fromQuery;
  } else {
    try {
      accountIds = await listMetaAccountIdsForUser(user.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "query_failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const seenPixelIds = new Set<string>();
  const pixels: WizardPixel[] = [];

  for (const rawAct of accountIds) {
    const actPath = normalizeActId(rawAct);
    const accountId = actPath.replace(/^act_/i, "");
    try {
      const rows = await listPixelsForAct({
        actId: actPath,
        accessToken: tokenRes.accessToken,
      });
      for (const row of rows) {
        if (seenPixelIds.has(row.id)) continue;
        seenPixelIds.add(row.id);
        pixels.push({ id: row.id, name: row.name, accountId });
      }
    } catch {
      /* skip accounts without permission or Graph errors — other accounts may still succeed */
    }
  }

  return NextResponse.json({ data: pixels });
}
