import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseUploadJobErrorDetails,
  parseUploadJobSummary,
} from "@/lib/api/upload-job-summary-schema";
import { getSessionUser } from "@/lib/api/session";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = querySchema.safeParse({ limit: url.searchParams.get("limit") ?? undefined });
  const limit = q.success ? q.data.limit : 50;

  const { data, error } = await supabase
    .from("upload_jobs")
    .select("id,account_name,total,done,status,started_at,finished_at,summary,error_details")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const jobs = (data ?? []).map((row) => ({
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
}
