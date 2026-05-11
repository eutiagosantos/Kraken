"use client";

import { useEffect, useState } from "react";

import type { MetricsChartPoint } from "@/lib/mock-data";
import type { MockActiveUpload, MockActivity, MockCreativeLibraryItem, MockStat } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/app/home/ActivityFeed";
import { CampaignProgress } from "@/components/app/home/CampaignProgress";
import { CreativesSummary } from "@/components/app/home/CreativesSummary";
import { MetricsChart } from "@/components/app/home/MetricsChart";
import { StatsRow } from "@/components/app/home/StatsRow";

type Period = "7D" | "30D" | "90D";

type DashboardPayload = {
  stats: MockStat[];
  uploads: MockActiveUpload[];
  activities: MockActivity[];
  creatives: MockCreativeLibraryItem[];
  metrics: Record<Period, MetricsChartPoint[]>;
};

export function HomeDashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/dashboard", { credentials: "include" });
        const json = (await res.json()) as DashboardPayload & { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "Falha ao carregar o painel");
        }
        if (!cancelled) {
          setData({
            stats: json.stats ?? [],
            uploads: json.uploads ?? [],
            activities: json.activities ?? [],
            creatives: json.creatives ?? [],
            metrics: json.metrics ?? ({} as Record<Period, MetricsChartPoint[]>),
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro");
          setData({
            stats: [],
            uploads: [],
            activities: [],
            creatives: [],
            metrics: {} as Record<Period, MetricsChartPoint[]>,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data && !error) {
    return (
      <div className="mx-auto max-w-[1680px]">
        <p className="text-sm text-dashboard-muted">A carregar o painel…</p>
      </div>
    );
  }

  const d = data ?? {
    stats: [],
    uploads: [],
    activities: [],
    creatives: [],
    metrics: {} as Record<Period, MetricsChartPoint[]>,
  };

  return (
    <div className="mx-auto max-w-[1680px]">
      {error ? (
        <p className="mb-4 rounded-lg border border-semantic-yellow/40 bg-semantic-yellow-bg px-3 py-2 text-sm text-neutral-black">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[1fr_minmax(280px,360px)] xl:items-start xl:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="overflow-x-auto pb-1 md:overflow-visible">
            <div className="min-w-[min(100%,640px)]">
              <StatsRow stats={d.stats} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <CreativesSummary items={d.creatives} />
            <CampaignProgress jobs={d.uploads} />
          </div>
          <MetricsChart datasets={d.metrics} />
        </div>
        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[4.5rem] xl:self-start">
          <ActivityFeed activities={d.activities} />
        </aside>
      </div>
    </div>
  );
}
