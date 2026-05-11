"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { useIsClient } from "@/lib/hooks/use-is-client";

export function SparklineChart({
  data,
  gradientId,
  height = 48,
}: {
  data: { day: string; value: number }[];
  gradientId: string;
  height?: number;
}) {
  const chartData = data.map((d) => ({ ...d, label: d.day }));
  const isClient = useIsClient();
  return (
    <div style={{ height }} className="w-full">
      {isClient ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7132f5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#7132f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8f0" }}
              formatter={(v) => [`R$ ${(v as number).toLocaleString("pt-BR")}`, "Gasto"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7132f5"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" aria-hidden />
      )}
    </div>
  );
}
