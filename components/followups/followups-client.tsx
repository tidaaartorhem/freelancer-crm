"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { followupSchema, type FollowupInput } from "@/lib/validations";
import {
  completeFollowupAction,
  createFollowupAction,
  deleteFollowupAction,
} from "@/app/actions";
import { formatDate, isOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell } from "lucide-react";

export interface FollowupRow {
  id: string;
  title: string;
  dueDate: Date;
  completedAt: Date | null;
  notes: string | null;
  dealTitle: string | null;
  clientName: string | null;
}

function FollowupForm({
  deals,
  clients,
  onDone,
}: {
  deals: Array<{ id: string; title: string }>;
  clients: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FollowupInput>({
    resolver: zodResolver(followupSchema) as unknown as Resolver<FollowupInput>,
  });

  const onSubmit = async (values: FollowupInput) => {
    setServerError(null);
    const result = await createFollowupAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fu-title">Title</Label>
        <Input id="fu-title" {...register("title")} placeholder="Follow up on proposal" />
        {errors.title && (
          <p role="alert" className="text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fu-deal">Deal (optional)</Label>
          <Select id="fu-deal" {...register("dealId")}>
            <option value="">None</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fu-client">Client (optional)</Label>
          <Select id="fu-client" {...register("clientId")}>
            <option value="">None</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fu-due">Due date</Label>
        <Input id="fu-due" type="date" {...register("dueDate")} />
        {errors.dueDate && (
          <p role="alert" className="text-xs text-red-600">{errors.dueDate.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fu-notes">Notes</Label>
        <Textarea id="fu-notes" {...register("notes")} rows={2} />
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600">{serverError}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add follow-up"}
        </Button>
      </div>
    </form>
  );
}

export function FollowupsClient({
  followups,
  deals,
  clients,
}: {
  followups: FollowupRow[];
  deals: Array<{ id: string; title: string }>;
  clients: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const overdue = followups.filter((f) => !f.completedAt && isOverdue(f.dueDate));
  const upcoming = followups.filter((f) => !f.completedAt && !isOverdue(f.dueDate));
  const done = followups.filter((f) => f.completedAt);

  const row = (f: FollowupRow) => {
    const isDone = Boolean(f.completedAt);
    const od = !isDone && isOverdue(f.dueDate);
    return (
      <li
        key={f.id}
        className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3"
      >
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant={isDone ? "default" : "outline"}
            aria-label={isDone ? `Reopen ${f.title}` : `Complete ${f.title}`}
            disabled={busy === f.id || isDone}
            onClick={async () => {
              setBusy(f.id);
              await completeFollowupAction(f.id);
              setBusy(null);
              router.refresh();
            }}
          >
            <Check className="size-4" />
          </Button>
          <div>
            <p className={`text-sm font-medium ${isDone ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
              {f.title}
            </p>
            <p className="text-xs text-zinc-500">
              {f.clientName ?? f.dealTitle ?? "General"} · due {formatDate(f.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {od && <Badge variant="danger">Overdue</Badge>}
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete ${f.title}`}
            className="text-zinc-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(`Delete "${f.title}"?`)) {
                setBusy(f.id);
                await deleteFollowupAction(f.id);
                setBusy(null);
                router.refresh();
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </li>
    );
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add follow-up
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add follow-up"
        description="Never let a deal go quiet."
      >
        <FollowupForm
          deals={deals}
          clients={clients}
          onDone={() => setOpen(false)}
        />
      </Dialog>

      {followups.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5" />}
          title="No follow-ups"
          description="Add reminders so no proposal or check-in slips through the cracks."
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section aria-labelledby="od-heading">
              <h2 id="od-heading" className="mb-2 text-sm font-semibold text-red-700">
                Overdue ({overdue.length})
              </h2>
              <ul className="space-y-2">{overdue.map(row)}</ul>
            </section>
          )}
          <section aria-labelledby="up-heading">
            <h2 id="up-heading" className="mb-2 text-sm font-semibold text-zinc-800">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing upcoming.</p>
            ) : (
              <ul className="space-y-2">{upcoming.map(row)}</ul>
            )}
          </section>
          {done.length > 0 && (
            <section aria-labelledby="done-heading">
              <h2 id="done-heading" className="mb-2 text-sm font-semibold text-zinc-500">
                Completed ({done.length})
              </h2>
              <ul className="space-y-2">{done.map(row)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
