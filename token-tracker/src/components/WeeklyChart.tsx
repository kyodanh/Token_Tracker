import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DailySpend } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";

interface Props {
  weeklySpend: DailySpend[];
}

const DAYS     = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ABBR = ["Su",  "Mo",  "Tu",  "We",  "Th",  "Fr",  "Sa"];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildChartData(weeklySpend: DailySpend[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = localDateStr(d);
    const daySpends = weeklySpend.filter((s) => s.date === dateStr);
    const cost = daySpends.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);
    const tokens = daySpends.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0);
    return { label: DAY_ABBR[d.getDay()], cost, tokens, isToday: i === 6, date: dateStr, fullDay: DAYS[d.getDay()] };
  });
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

interface DayDetailProps {
  date: string;
  fullDay: string;
  spends: DailySpend[];
}

function DayDetail({ date, fullDay, spends }: DayDetailProps) {
  const daySpends = spends.filter((s) => s.date === date);
  const totalCost = daySpends.reduce((s, d) => s + (d.costUsd ?? 0), 0);
  const totalTokens = daySpends.reduce((s, d) => s + (d.tokensUsed ?? 0), 0);

  const byProvider = Object.entries(
    daySpends.reduce<Record<string, { cost: number; tokens: number }>>((acc, d) => {
      if (!acc[d.providerId]) acc[d.providerId] = { cost: 0, tokens: 0 };
      acc[d.providerId].cost += d.costUsd ?? 0;
      acc[d.providerId].tokens += d.tokensUsed ?? 0;
      return acc;
    }, {})
  );

  const isToday = date === new Date().toISOString().split("T")[0];
  const displayDate = isToday ? "Today" : `${fullDay}, ${date.slice(5).replace("-", "/")}`;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        background: "rgba(240,168,80,0.06)",
        border: "1px solid rgba(240,168,80,0.15)",
        borderRadius: 8,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#f0a850", letterSpacing: "0.5px" }}>
          {displayDate.toUpperCase()}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 10.5, color: "#7a7a7e" }}>{formatTokens(totalTokens)} tok</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0a850", fontFamily: "'JetBrains Mono',monospace" }}>
            ${totalCost.toFixed(3)}
          </span>
        </div>
      </div>

      {daySpends.length === 0 ? (
        <span style={{ fontSize: 11, color: "#6a6a6e" }}>No usage recorded</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {byProvider.map(([pid, { cost, tokens }]) => {
            const display = PROVIDER_DISPLAY[pid];
            const name = display?.name ?? pid;
            const maxCost = Math.max(...byProvider.map(([, v]) => v.cost), 0.0001);
            const barPct = Math.round((cost / maxCost) * 100);
            return (
              <div key={pid}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10.5, color: "#b0b0b4" }}>{name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontSize: 10, color: "#6a6a6e" }}>{formatTokens(tokens)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#e9e9ec", fontFamily: "'JetBrains Mono',monospace" }}>
                      ${cost.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: display?.color ?? "#f0a850",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WeeklyChart({ weeklySpend }: Props) {
  const data = buildChartData(weeklySpend);
  const sevenDayTotal = data.reduce((sum, d) => sum + d.cost, 0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedEntry = data.find((d) => d.date === selectedDate);

  const handleBarClick = (entry: { date: string }) => {
    setSelectedDate((prev) => (prev === entry.date ? null : entry.date));
  };

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
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }`}</style>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
          7-DAY SPEND
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f0a850", fontFamily: "'JetBrains Mono',monospace" }}>
          ${sevenDayTotal.toFixed(2)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={56}>
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap="30%"
          onClick={(e: unknown) => {
            const ev = e as { activePayload?: Array<{ payload: { date: string } }> };
            if (ev?.activePayload?.[0]) {
              handleBarClick(ev.activePayload[0].payload);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <XAxis
            dataKey="label"
            tick={{ fill: "#6a6a6e", fontSize: 9 }}
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
              padding: "6px 10px",
            }}
            itemStyle={{ color: "#e9e9ec" }}
            labelStyle={{ color: "#7a7a7e", marginBottom: 2 }}
            formatter={(v: unknown, _name: unknown, props: { payload?: { tokens?: number } }) => {
              const tokens = props?.payload?.tokens ?? 0;
              return [`$${(v as number).toFixed(3)} · ${formatTokens(tokens)} tok`, ""];
            }}
            labelFormatter={(_label: unknown, payload: unknown) => {
              const p = payload as Array<{ payload?: { fullDay?: string } }>;
              return p?.[0]?.payload?.fullDay ?? String(_label);
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="cost" radius={[4, 4, 2, 2]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.date === selectedDate
                    ? "#f0a850"
                    : entry.isToday
                    ? "rgba(240,168,80,0.85)"
                    : "rgba(232,148,58,0.5)"
                }
                stroke={entry.date === selectedDate ? "rgba(240,168,80,0.4)" : "none"}
                strokeWidth={entry.date === selectedDate ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 4, textAlign: "center" }}>
        <span style={{ fontSize: 9.5, color: "#4a4a4e" }}>click a bar for daily breakdown</span>
      </div>

      {selectedEntry && (
        <DayDetail
          date={selectedEntry.date}
          fullDay={selectedEntry.fullDay}
          spends={weeklySpend}
        />
      )}
    </div>
  );
}
