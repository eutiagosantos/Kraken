import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NextResponse } from "next/server";

import { devLogRouteMs } from "@/lib/api/dev-route-timing";
import { getSessionUser } from "@/lib/api/session";
import {
  getCachedHomeDashboardRows,
  setCachedHomeDashboardRows,
} from "@/lib/api/user-data-short-cache";
import type { MetricsChartPoint } from "@/lib/mock-data";
import type { MockActiveUpload, MockActivity, MockCreativeLibraryItem, MockStat } from "@/lib/mock-data";

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
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let rows = getCachedHomeDashboardRows(user.id);
  if (!rows) {
    const [kpisRes, uploadsRes, activitiesRes, creativesRes] = await Promise.all([
      supabase.from("home_kpis").select("*").eq("user_id", user.id).order("label"),
      supabase.from("upload_jobs").select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(12),
      supabase.from("activity_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("creative_library_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
    ]);

    if (kpisRes.error || uploadsRes.error || activitiesRes.error || creativesRes.error) {
      const msg =
        kpisRes.error?.message ||
        uploadsRes.error?.message ||
        activitiesRes.error?.message ||
        creativesRes.error?.message ||
        "query_failed";
      devLogRouteMs("GET /api/home/dashboard (error)", startedAt);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    rows = {
      kpis: kpisRes.data ?? [],
      uploads: uploadsRes.data ?? [],
      activities: activitiesRes.data ?? [],
      creatives: creativesRes.data ?? [],
    };
    setCachedHomeDashboardRows(user.id, rows);
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
