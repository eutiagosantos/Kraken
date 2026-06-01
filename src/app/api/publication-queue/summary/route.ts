import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import { countMetaAdAccountsForUser } from "@/libs/database/queries/meta-ad-accounts";
import { listUploadJobsForQueueSummary } from "@/libs/database/queries/upload-jobs";
import { computePublicationQueueSummary } from "@/libs/publication-queue/compute-panel-summary";

export const runtime = "nodejs";

export async function GET() {
  const auth = await assertProtectedApiRoute();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  const [jobs, connectedAccounts] = await Promise.all([
    listUploadJobsForQueueSummary(user.id, 50),
    countMetaAdAccountsForUser(user.id),
  ]);

  const summary = computePublicationQueueSummary(jobs, connectedAccounts);

  return NextResponse.json({ data: summary });
}
