import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";
import { computePublicationQueueSummary } from "@/lib/publication-queue/compute-panel-summary";

export const runtime = "nodejs";

export async function GET() {
  const auth = await assertProtectedApiRoute();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const [jobsRes, accountsRes] = await Promise.all([
    supabase
      .from("upload_jobs")
      .select("total,done,status,started_at,finished_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("meta_ad_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (jobsRes.error) {
    return NextResponse.json({ error: jobsRes.error.message }, { status: 500 });
  }
  if (accountsRes.error) {
    return NextResponse.json({ error: accountsRes.error.message }, { status: 500 });
  }

  const summary = computePublicationQueueSummary(
    jobsRes.data ?? [],
    accountsRes.count ?? 0
  );

  return NextResponse.json({ data: summary });
}
