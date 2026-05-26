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
import type { DailyPoint } from "@/lib/admin-queries";

export function RevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-[300px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
            }
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "12px",
              direction: "rtl",
            }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 400 }}
            itemStyle={{ color: "var(--foreground)" }}
            formatter={(value) => [
              `₪${Number(value).toLocaleString("he-IL")}`,
              "מכירות",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--brand-accent)"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ data, height = 32 }: { data: number[]; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: 80, height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--brand-accent)"
            strokeWidth={1.5}
            fill="url(#sparklineFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
