import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

/** Meta webhook verification (Graph `GET` challenge). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verify = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && verify && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

/** Meta webhook delivery — valida `X-Hub-Signature-256` quando `META_APP_SECRET` está definido. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const sigHeader = request.headers.get("x-hub-signature-256")?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();

  let signatureValid = false;
  if (appSecret && sigHeader?.startsWith("sha256=")) {
    const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(sigHeader, "utf8");
      signatureValid = a.length === b.length && timingSafeEqual(a, b);
    } catch {
      signatureValid = false;
    }
  }

  if (appSecret && !signatureValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let topic: string | null = null;
  let payload: Json = {};
  try {
    const j = JSON.parse(rawBody) as { object?: string };
    topic = typeof j.object === "string" ? j.object : null;
    payload = (JSON.parse(rawBody) as Json) ?? {};
  } catch {
    payload = { raw: rawBody.slice(0, 2000) } as unknown as Json;
  }

  const service = createServiceSupabaseClient();
  if (service) {
    await service.from("meta_webhook_events").insert({
      topic,
      payload,
      signature_valid: !appSecret || signatureValid,
    });
  }

  return NextResponse.json({ ok: true });
}
