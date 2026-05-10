"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function MiniTrendSparkline({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-7 w-[72px] shrink-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke="#7132f5"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
