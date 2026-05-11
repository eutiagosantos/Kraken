import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import { normalizeActId } from "@/lib/meta/graph-campaign-publish";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { wizardPublishPayloadSchema } from "@/lib/meta/map-wizard-to-graph";
import { runWizardPublish } from "@/lib/meta/publish-campaigns";

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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        error:
          "Content-Type deve ser multipart/form-data com campo «payload» (JSON) e ficheiros «creative_0», …",
      },
      { status: 400 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corpo multipart inválido." }, { status: 400 });
  }

  const payloadField = form.get("payload");
  if (typeof payloadField !== "string") {
    return NextResponse.json({ error: "Campo «payload» (string JSON) em falta." }, { status: 400 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(payloadField);
  } catch {
    return NextResponse.json({ error: "«payload» não é JSON válido." }, { status: 400 });
  }

  const parsed = wizardPublishPayloadSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const pageId = parsed.data.pageId?.trim() || process.env.META_DEFAULT_PAGE_ID?.trim();
  if (!pageId) {
    return NextResponse.json(
      {
        error:
          "Defina META_DEFAULT_PAGE_ID no servidor ou envie «pageId» no payload (ID da Página Facebook para o anúncio).",
      },
      { status: 400 }
    );
  }

  const adLinkUrl = process.env.META_AD_LINK_URL?.trim() || "https://www.facebook.com/business";

  const tokenRes = await getMetaGraphAccessToken(supabase, user.id);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  const normIds = Array.from(new Set(parsed.data.selectedAccountIds.map((id) => normalizeActId(id))));
  const { data: accountRows, error: accErr } = await supabase
    .from("meta_ad_accounts")
    .select("meta_account_id, name")
    .eq("user_id", user.id)
    .in("meta_account_id", normIds);

  if (accErr) {
    return NextResponse.json({ error: accErr.message }, { status: 500 });
  }
  if (!accountRows?.length || accountRows.length !== normIds.length) {
    return NextResponse.json(
      { error: "Uma ou mais contas selecionadas não existem ou não pertencem ao teu utilizador." },
      { status: 400 }
    );
  }

  const accountsOrdered = orderSelectedAccounts(parsed.data.selectedAccountIds, accountRows);

  const creativeFilesByIndex = new Map<number, { buffer: Buffer; mimeType: string }>();
  for (let i = 0; i < parsed.data.creatives.length; i++) {
    const field = form.get(`creative_${i}`);
    if (field instanceof Blob) {
      const buf = Buffer.from(await field.arrayBuffer());
      const mimeType =
        "type" in field && typeof (field as File).type === "string" && (field as File).type
          ? (field as File).type
          : "image/jpeg";
      creativeFilesByIndex.set(i, { buffer: buf, mimeType });
    }
  }

  try {
    const out = await runWizardPublish({
      supabase,
      userId: user.id,
      accessToken: tokenRes.accessToken,
      payload: parsed.data,
      creativeFilesByIndex,
      pageId,
      adLinkUrl,
      accounts: accountsOrdered,
    });
    return NextResponse.json({
      publishId: out.publishId,
      results: out.results,
      warnings: out.warnings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "publish_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
