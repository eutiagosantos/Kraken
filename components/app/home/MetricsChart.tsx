"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockMetricsSeries } from "@/lib/mock-data";

export function MetricsChart() {
  return (
    <div className="rounded-card border border-dashboard-border bg-dashboard-surface p-5 shadow-subtle md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-black">Métricas da semana</h3>
          <p className="text-sm text-dashboard-muted">Uploads vs. gasto estimado (mock)</p>
        </div>
      </div>
      <div className="h-[220px] w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockMetricsSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7132f5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7132f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#9497a9", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9497a9", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e8e8f0",
                boxShadow: "0px 4px 24px rgba(0,0,0,0.06)",
              }}
              labelStyle={{ fontWeight: 700, color: "#101114" }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              name="Gasto (R$)"
              stroke="#7132f5"
              strokeWidth={2}
              fill="url(#fillSpend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
