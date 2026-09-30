import * as React from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "default" | "danger" | "success";
  className?: string;
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "default",
  className,
}: StatProps) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          {icon && <span className="text-zinc-400">{icon}</span>}
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            tone === "danger" && "text-red-600",
            tone === "success" && "text-emerald-600",
            tone === "default" && "text-zinc-900"
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}
