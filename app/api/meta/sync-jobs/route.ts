import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/api/session";
import { enqueueMetaSyncJob } from "@/lib/meta/meta-sync-jobs";
import type { ProductFeedRow } from "@/lib/meta/validate-product-feed";

const postBody = z.discriminatedUnion("jobType", [
  z.object({
    jobType: z.literal("feed_validate"),
    rows: z.array(z.record(z.string(), z.unknown())).min(1),
    idempotencyKey: z.string().max(200).optional(),
  }),
  z.object({
    jobType: z.literal("feed_sync_url"),
    feedId: z.string().min(1),
    url: z.string().min(1).max(2048),
    idempotencyKey: z.string().max(200).optional(),
  }),
]);

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = postBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.jobType === "feed_validate") {
    const rows = parsed.data.rows as ProductFeedRow[];
    const enq = await enqueueMetaSyncJob(supabase, {
      userId: user.id,
      jobType: "feed_validate",
      payload: { rows },
      idempotencyKey: parsed.data.idempotencyKey,
    });
    if (!enq.ok) return NextResponse.json({ error: enq.error }, { status: 400 });
    return NextResponse.json({ ok: true, jobId: enq.id });
  }

  const enq = await enqueueMetaSyncJob(supabase, {
    userId: user.id,
    jobType: "feed_sync_url",
    payload: { feedId: parsed.data.feedId, url: parsed.data.url },
    idempotencyKey: parsed.data.idempotencyKey,
  });
  if (!enq.ok) return NextResponse.json({ error: enq.error }, { status: 400 });
  return NextResponse.json({ ok: true, jobId: enq.id });
}
