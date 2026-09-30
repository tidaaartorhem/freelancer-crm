"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Send, Sparkles, Trash2, X } from "lucide-react";
import {
  approveDraftAction,
  deleteDraftAction,
  generateDraftAction,
  markDraftSentAction,
  rejectDraftAction,
} from "@/app/actions";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AtRiskDeal } from "@/lib/at-risk";
import type { Draft } from "@/db/schema";

interface AssistantClientProps {
  atRisk: AtRiskDeal[];
  drafts: Array<Draft & { dealTitle: string; clientName: string }>;
  providerLabel: string;
}

export function AssistantClient({ atRisk, drafts, providerLabel }: AssistantClientProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(key);
    setError(null);
    try {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
      router.refresh();
    }
  };

  const pending = drafts.filter((d) => d.status === "pending");
  const approved = drafts.filter((d) => d.status === "approved");
  const history = drafts.filter((d) => d.status === "rejected" || d.status === "sent");

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <section aria-labelledby="atrisk-heading">
        <h2 id="atrisk-heading" className="mb-3 text-base font-semibold text-zinc-900">
          Deals that need attention
        </h2>
        {atRisk.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No at-risk deals right now. The assistant is watching the pipeline.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {atRisk.map((d) => (
              <Card key={d.id} className="border-red-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{d.title}</p>
                      <p className="text-xs text-zinc-500">
                        {d.clientName} · {formatMoney(d.valueCents)}
                      </p>
                    </div>
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle className="size-3" />
                      At risk
                    </Badge>
                  </div>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-red-700">
                    {d.risk.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={busy === d.id}
                    onClick={() => run(d.id, () => generateDraftAction(d.id))}
                  >
                    <Sparkles className="size-3.5" />
                    {busy === d.id ? "Drafting…" : "Draft follow-up"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          Drafts are written by the {providerLabel} provider and always wait for
          your approval — nothing is sent automatically.
        </p>
      </section>

      <section aria-labelledby="queue-heading">
        <h2 id="queue-heading" className="mb-3 text-base font-semibold text-zinc-900">
          Approval queue
          {pending.length > 0 && (
            <Badge variant="warning" className="ml-2">
              {pending.length} pending
            </Badge>
          )}
        </h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<Send className="size-5" />}
            title="Queue is clear"
            description="Draft a follow-up for an at-risk deal and it will appear here for review."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{d.subject}</CardTitle>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        For {d.clientName} · {d.dealTitle} · drafted by {d.provider}
                        {d.model ? ` (${d.model})` : ""}
                      </p>
                    </div>
                    <Badge variant="warning">Pending review</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                    {d.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => run(d.id, () => approveDraftAction(d.id))}
                    >
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === d.id}
                      onClick={() => run(d.id, () => rejectDraftAction(d.id))}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400 hover:text-red-600"
                      disabled={busy === d.id}
                      onClick={() => run(d.id, () => deleteDraftAction(d.id))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {approved.length > 0 && (
        <section aria-labelledby="approved-heading">
          <h2 id="approved-heading" className="mb-3 text-base font-semibold text-zinc-900">
            Approved — ready to send
          </h2>
          <div className="space-y-3">
            {approved.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{d.subject}</p>
                    <p className="text-xs text-zinc-500">
                      {d.clientName} · {d.dealTitle}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === d.id}
                    onClick={() => run(d.id, () => markDraftSentAction(d.id))}
                  >
                    <Send className="size-3.5" />
                    {busy === d.id ? "Saving…" : "Mark as sent"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-3 text-base font-semibold text-zinc-900">
            History
          </h2>
          <ul className="space-y-2">
            {history.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 p-3 text-sm"
              >
                <span className="text-zinc-700">{d.subject}</span>
                <Badge variant={d.status === "sent" ? "success" : "secondary"}>
                  {d.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
