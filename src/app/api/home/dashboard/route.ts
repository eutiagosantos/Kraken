import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NextResponse } from "next/server";

import { devLogRouteMs } from "@/libs/api/dev-route-timing";
import { getSessionUser } from "@/libs/api/session";
import {
  getCachedHomeDashboardRows,
  setCachedHomeDashboardRows,
} from "@/libs/api/user-data-short-cache";
import { listActivityEventsByUserId } from "@/libs/database/queries/activity-events";
import { listCreativeLibraryItemsByUserId } from "@/libs/database/queries/creative-library-items";
import { listHomeKpisByUserId } from "@/libs/database/queries/home-kpis";
import { listUploadJobs } from "@/libs/database/queries/upload-jobs";
import { postgresErrorMessage } from "@/libs/database/postgres-error";
import type { MetricsChartPoint } from "@/libs/mock-data";
import type { MockActiveUpload, MockActivity, MockCreativeLibraryItem, MockStat } from "@/libs/mock-data";

function emptyWeek(): MetricsChartPoint[] {
  return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((name) => ({
    name,
    uploads: 0,
    spend: 0,
  }));
}

function emptyMetrics() {
  return {
    "7D": emptyWeek(),
    "30D": [
      { name: "S1", uploads: 0, spend: 0 },
      { name: "S2", uploads: 0, spend: 0 },
      { name: "S3", uploads: 0, spend: 0 },
      { name: "S4", uploads: 0, spend: 0 },
    ],
    "90D": [
      { name: "Jan", uploads: 0, spend: 0 },
      { name: "Fev", uploads: 0, spend: 0 },
      { name: "Mar", uploads: 0, spend: 0 },
    ],
  };
}

export async function GET() {
  const startedAt = Date.now();
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let rows = getCachedHomeDashboardRows(user.id);
  if (!rows) {
    try {
      const [kpis, uploads, activities, creatives] = await Promise.all([
        listHomeKpisByUserId(user.id),
        listUploadJobs(user.id, 12),
        listActivityEventsByUserId(user.id, 25),
        listCreativeLibraryItemsByUserId(user.id, 12),
      ]);

      rows = {
        kpis,
        uploads,
        activities,
        creatives,
      };
      setCachedHomeDashboardRows(user.id, rows);
    } catch (err) {
      devLogRouteMs("GET /api/home/dashboard (error)", startedAt);
      return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
    }
  }

  const stats: MockStat[] = rows.kpis.map((k) => ({
    label: k.label,
    value: k.value,
    delta: k.delta ?? "—",
    deltaType: (k.delta_type === "positive" || k.delta_type === "negative" || k.delta_type === "neutral"
      ? k.delta_type
      : "neutral") as MockStat["deltaType"],
    iconColor: k.icon_color || "#7132f5",
  }));

  const uploads: MockActiveUpload[] = rows.uploads.map((u) => ({
    id: u.id,
    account: u.account_name,
    total: u.total,
    done: u.done,
    status: u.status as MockActiveUpload["status"],
    startedAt: format(new Date(u.started_at), "HH:mm", { locale: ptBR }),
  }));

  const activities: MockActivity[] = rows.activities.map((a) => ({
    id: a.id,
    type: a.type as MockActivity["type"],
    message: a.message,
    account: a.account,
    time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }),
  }));

  const creatives: MockCreativeLibraryItem[] = rows.creatives.map((c) => ({
    id: c.id,
    name: c.name,
    format: c.format,
    status: c.status as MockCreativeLibraryItem["status"],
    campaignsCount: c.campaigns_count,
  }));

  devLogRouteMs("GET /api/home/dashboard", startedAt);
  return NextResponse.json({
    stats,
    uploads,
    activities,
    creatives,
    metrics: emptyMetrics(),
  });
}
