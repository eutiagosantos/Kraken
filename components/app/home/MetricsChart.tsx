"use client";

import { useState } from "react";
import { useIsClient } from "@/lib/hooks/use-is-client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { name: string; uploads: number; spend: number };

function emptyWeek(): Point[] {
  return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((name) => ({ name, uploads: 0, spend: 0 }));
}

const defaultDatasets: Record<string, Point[]> = {
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

const PERIODS = ["7D", "30D", "90D"] as const;
type Period = (typeof PERIODS)[number];

type MetricsChartProps = {
  datasets?: Partial<Record<Period, Point[]>>;
};

export function MetricsChart({ datasets: datasetsProp }: MetricsChartProps) {
  const [period, setPeriod] = useState<Period>("7D");
  const datasets = { ...defaultDatasets, ...datasetsProp } as Record<Period, Point[]>;
  const chartData = datasets[period] ?? defaultDatasets[period];
  const isClient = useIsClient();

  return (
    <div className="rounded-card border border-dashboard-border bg-dashboard-surface p-5 shadow-subtle md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-black">Campanhas e gasto</h3>
          <p className="text-sm text-dashboard-muted">Publicações concluídas e gasto estimado por período</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-dashboard-border bg-dashboard-base p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={
                period === p
                  ? "rounded-md bg-dashboard-surface px-3 py-1 text-xs font-bold text-neutral-black shadow-subtle"
                  : "rounded-md px-3 py-1 text-xs font-medium text-dashboard-muted transition-colors hover:text-neutral-black"
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px] w-full min-h-[200px]">
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7132f5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7132f5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillUploads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#149e61" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#149e61" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9497a9", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#9497a9", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#9497a9", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e8e8f0",
                  boxShadow: "0px 4px 24px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
                labelStyle={{ fontWeight: 700, color: "#101114", marginBottom: 4 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#9497a9" }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                name="Gasto (R$)"
                stroke="#7132f5"
                strokeWidth={2}
                fill="url(#fillSpend)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="uploads"
                name="Publicações"
                stroke="#149e61"
                strokeWidth={2}
                fill="url(#fillUploads)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full" aria-hidden />
        )}
      </div>
    </div>
  );
}
