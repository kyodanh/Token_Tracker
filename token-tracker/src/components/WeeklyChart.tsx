import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DailySpend } from "../lib/types";

interface Props {
  weeklySpend: DailySpend[];
  totalCost: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildChartData(weeklySpend: DailySpend[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const cost = weeklySpend
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + (s.costUsd ?? 0), 0);
    return { label: DAYS[d.getDay()].charAt(0), cost, isToday: i === 6 };
  });
}

export function WeeklyChart({ weeklySpend, totalCost }: Props) {
  const data = buildChartData(weeklySpend);

  return (
    <div
      style={{
        margin: "14px 16px 0",
        padding: "13px 16px 16px",
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
          7-DAY SPEND
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f0a850", fontFamily: "'JetBrains Mono',monospace" }}>
          ${totalCost.toFixed(2)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={56}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            tick={{ fill: "#6a6a6e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#1e1e20",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 11,
              color: "#e9e9ec",
            }}
            formatter={(v: unknown) => [`$${(v as number).toFixed(3)}`, "Cost"]}
            labelStyle={{ color: "#7a7a7e" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="cost" radius={[4, 4, 2, 2]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday ? "#f0a850" : "rgba(232,148,58,0.5)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
