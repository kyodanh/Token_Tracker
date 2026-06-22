import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
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
    return { label: DAYS[d.getDay()], cost };
  });
}

export function WeeklyChart({ weeklySpend, totalCost }: Props) {
  const data = buildChartData(weeklySpend);

  return (
    <div className="px-4 py-3 border-b border-[#2a2a2a]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-[#666] font-semibold tracking-wide">7-DAY SPEND</span>
        <span className="text-sm text-amber-400 font-semibold">${totalCost.toFixed(2)}</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#666", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              fontSize: 11,
              color: "#e5e5e5",
            }}
            formatter={(v: unknown) => [`$${(v as number).toFixed(3)}`, "Cost"]}
            labelStyle={{ color: "#666" }}
          />
          <Bar dataKey="cost" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#b45309" opacity={i === 6 ? 1 : 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
