"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

interface StageDatum {
  stage: string;
  value: number;
  count: number;
}

export function PipelineChart({ data }: { data: StageDatum[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Pipeline value by stage chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 12, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
            }
          />
          <Tooltip
            formatter={(value, name) => [
              name === "value"
                ? formatMoney(Number(value ?? 0) * 100)
                : String(value ?? ""),
              name === "value" ? "Pipeline value" : "Deals",
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
