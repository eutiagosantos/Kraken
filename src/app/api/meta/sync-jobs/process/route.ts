import { NextResponse } from "next/server";

import { processMetaSyncJobsBatch } from "@/libs/meta/meta-sync-job-worker";

export const runtime = "nodejs";

/**
 * Cron / worker: define `META_CRON_SECRET` e chama `POST /api/meta/sync-jobs/process` com header
 * `Authorization: Bearer <META_CRON_SECRET>`.
 */
export async function POST(request: Request) {
  const secret = process.env.META_CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "META_CRON_SECRET não configurado." }, { status: 503 });
  }
  const auth = request.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processMetaSyncJobsBatch(20);
  return NextResponse.json(result);
}
