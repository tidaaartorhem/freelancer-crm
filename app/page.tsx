import Link from "next/link";
import { AlertTriangle, Bell, Briefcase, TrendingUp } from "lucide-react";
import { listAtRiskDeals, pipelineTotals, STAGES } from "@/services/deals";
import { listFollowups } from "@/services/followups";
import { invoiceTotals } from "@/services/invoices";
import { formatMoney, formatRelative, isOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { WinLossChart } from "@/components/dashboard/win-loss-chart";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  proposal: "Proposal",
  negotiation: "Negotiation",
};

export default async function DashboardPage() {
  const [totals, atRisk, followups, invoices] = await Promise.all([
    pipelineTotals(),
    listAtRiskDeals(),
    listFollowups({ onlyOpen: true }),
    invoiceTotals(),
  ]);

  const upcoming = followups.slice(0, 5);
  const chartData = STAGES.filter((s) => s.id !== "won" && s.id !== "lost").map(
    (s) => ({
      stage: s.label,
      value: Math.round(totals.byStage[s.id].valueCents / 100),
      count: totals.byStage[s.id].count,
    })
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your pipeline, clients, and cash at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Open pipeline"
          value={formatMoney(totals.openValueCents)}
          sub="Across lead, proposal & negotiation"
          icon={<Briefcase className="size-4" />}
        />
        <Stat
          label="At-risk deals"
          value={String(atRisk.length)}
          sub="Need attention now"
          tone={atRisk.length > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="size-4" />}
        />
        <Stat
          label="Revenue won"
          value={formatMoney(totals.wonValueCents)}
          sub={`${totals.wonCount} deals closed`}
          tone="success"
          icon={<TrendingUp className="size-4" />}
        />
        <Stat
          label="Outstanding invoices"
          value={formatMoney(invoices.outstandingCents)}
          sub={
            invoices.overdueCount > 0
              ? `${invoices.overdueCount} overdue`
              : "Nothing overdue"
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pipeline value by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Win / loss</CardTitle>
          </CardHeader>
          <CardContent>
            <WinLossChart
              wonCents={totals.wonValueCents}
              lostCents={totals.lostValueCents}
              winRate={totals.winRate}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>At-risk deals</CardTitle>
            <Link
              href="/assistant"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Open AI assistant →
            </Link>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nothing at risk. Your pipeline is healthy.
              </p>
            ) : (
              <ul className="space-y-3">
                {atRisk.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <Link
                      href="/deals"
                      className="block rounded-md border border-red-100 bg-red-50/50 p-3 hover:border-red-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-900">
                          {d.title}
                        </p>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatMoney(d.valueCents)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {d.clientName} · {STAGE_LABELS[d.stage]}
                      </p>
                      <p className="mt-1.5 text-xs text-red-700">
                        {d.risk.reasons[0]}
                        {d.risk.reasons.length > 1 &&
                          ` (+${d.risk.reasons.length - 1} more)`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming follow-ups</CardTitle>
            <Link
              href="/followups"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No open follow-ups. Nothing slipping through the cracks.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((f) => {
                  const overdue = isOverdue(f.dueDate);
                  return (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Bell
                          className={`size-4 shrink-0 ${overdue ? "text-red-500" : "text-zinc-400"}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {f.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {f.clientName ?? f.dealTitle ?? "General"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={overdue ? "danger" : "secondary"}>
                        {overdue ? "Overdue" : formatRelative(f.dueDate)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
