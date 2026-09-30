"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatMoney } from "@/lib/format";

export function WinLossChart({
  wonCents,
  lostCents,
  winRate,
}: {
  wonCents: number;
  lostCents: number;
  winRate: number;
}) {
  const data = [
    { name: "Won", value: wonCents / 100 },
    { name: "Lost", value: lostCents / 100 },
  ];
  return (
    <div className="flex items-center gap-4">
      <div className="h-40 w-40 shrink-0" role="img" aria-label="Won versus lost revenue chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
            >
              <Cell fill="#059669" />
              <Cell fill="#e4e4e7" />
            </Pie>
            <Tooltip
              formatter={(v: number | undefined) => formatMoney((v ?? 0) * 100)}
              contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-zinc-500">Win rate</p>
          <p className="text-2xl font-semibold text-zinc-900">{winRate}%</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
          <span className="text-zinc-600">Won {formatMoney(wonCents)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-zinc-200" aria-hidden="true" />
          <span className="text-zinc-600">Lost {formatMoney(lostCents)}</span>
        </div>
      </div>
    </div>
  );
}
