import { NextResponse } from "next/server";

import { processMetaSyncJobsBatch } from "@/lib/meta/meta-sync-job-worker";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

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

  const service = createServiceSupabaseClient();
  if (!service) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY em falta." }, { status: 503 });
  }

  const result = await processMetaSyncJobsBatch(service, 20);
  return NextResponse.json(result);
}
