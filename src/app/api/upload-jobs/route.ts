import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseUploadJobErrorDetails,
  parseUploadJobSummary,
} from "@/libs/api/upload-job-summary-schema";
import { getSessionUser } from "@/libs/api/session";
import { listUploadJobsForApi } from "@/libs/database/queries/upload-jobs";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(request: Request) {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = querySchema.safeParse({ limit: url.searchParams.get("limit") ?? undefined });
  const limit = q.success ? q.data.limit : 50;

  try {
    const rows = await listUploadJobsForApi(user.id, limit);
    const jobs = rows.map((row) => ({
      id: row.id,
      account_name: row.account_name,
      total: row.total,
      done: row.done,
      status: row.status,
      started_at: row.started_at,
      finished_at: row.finished_at,
      summary: parseUploadJobSummary(row.summary),
      error_details: parseUploadJobErrorDetails(row.error_details),
    }));

    return NextResponse.json({ data: { jobs } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
