"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  setInvoiceStatusAction,
} from "@/app/actions";
import { formatDate, formatMoney, isOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { InvoiceStatus } from "@/db/schema";

export interface InvoiceRow {
  id: string;
  number: string;
  amountCents: number;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  clientName: string;
  dealTitle: string | null;
}

const STATUS_VARIANT: Record<InvoiceStatus, "secondary" | "info" | "success" | "danger"> = {
  draft: "secondary",
  sent: "info",
  paid: "success",
  overdue: "danger",
};

function InvoiceForm({
  clients,
  wonDeals,
  onDone,
}: {
  clients: Array<{ id: string; name: string }>;
  wonDeals: Array<{ id: string; title: string; clientId: string; valueCents: number }>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [defaultNumber] = React.useState(
    () => `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { status: "draft" },
  });

  const onDealChange = (dealId: string) => {
    const deal = wonDeals.find((d) => d.id === dealId);
    if (deal) {
      setValue("clientId", deal.clientId);
      setValue("amountCents", Math.round(deal.valueCents / 100));
    }
  };

  const onSubmit = async (values: InvoiceInput) => {
    setServerError(null);
    const payload = {
      ...values,
      amountCents: Math.round(Number(values.amountCents) * 100),
    };
    const result = await createInvoiceAction(payload);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inv-number">Invoice number</Label>
          <Input
            id="inv-number"
            {...register("number")}
            placeholder="INV-2026-004"
            defaultValue={defaultNumber}
          />
          {errors.number && (
            <p role="alert" className="text-xs text-red-600">{errors.number.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-deal">From won deal (optional)</Label>
          <Select
            id="inv-deal"
            {...register("dealId")}
            onChange={(e) => {
              register("dealId").onChange(e);
              onDealChange(e.target.value);
            }}
          >
            <option value="">None — manual invoice</option>
            {wonDeals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="inv-client">Client</Label>
          <Select id="inv-client" {...register("clientId")}>
            <option value="">Select…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {errors.clientId && (
            <p role="alert" className="text-xs text-red-600">{errors.clientId.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-amount">Amount (USD)</Label>
          <Input id="inv-amount" type="number" min={0} step="any" {...register("amountCents")} />
          {errors.amountCents && (
            <p role="alert" className="text-xs text-red-600">{errors.amountCents.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-due">Due date</Label>
          <Input id="inv-due" type="date" {...register("dueDate")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-notes">Notes</Label>
        <Textarea id="inv-notes" {...register("notes")} rows={2} />
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600">{serverError}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}

export function InvoicesClient({
  invoices,
  clients,
  wonDeals,
}: {
  invoices: InvoiceRow[];
  clients: Array<{ id: string; name: string }>;
  wonDeals: Array<{ id: string; title: string; clientId: string; valueCents: number }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const cycle = async (id: string, status: InvoiceStatus) => {
    setBusy(id);
    await setInvoiceStatusAction(id, status);
    setBusy(null);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New invoice
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="New invoice"
        description="Create an invoice manually or from a won deal."
      >
        <InvoiceForm clients={clients} wonDeals={wonDeals} onDone={() => setOpen(false)} />
      </Dialog>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No invoices yet"
          description="Create your first invoice when a deal closes."
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const overdue =
              inv.status !== "paid" && inv.dueDate && isOverdue(inv.dueDate);
            return (
              <Card key={inv.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {inv.number}
                      <span className="ml-2 font-normal text-zinc-500">
                        {inv.clientName}
                        {inv.dealTitle ? ` · ${inv.dealTitle}` : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatMoney(inv.amountCents)}
                      {inv.dueDate ? ` · due ${formatDate(inv.dueDate)}` : ""}
                      {inv.paidAt ? ` · paid ${formatDate(inv.paidAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={overdue ? "danger" : STATUS_VARIANT[inv.status]}>
                      {overdue ? "overdue" : inv.status}
                    </Badge>
                    {inv.status === "draft" && (
                      <Button size="sm" variant="outline" disabled={busy === inv.id} onClick={() => cycle(inv.id, "sent")}>
                        Mark sent
                      </Button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <Button size="sm" variant="outline" disabled={busy === inv.id} onClick={() => cycle(inv.id, "paid")}>
                        Mark paid
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${inv.number}`}
                      className="text-zinc-400 hover:text-red-600"
                      onClick={async () => {
                        if (window.confirm(`Delete ${inv.number}?`)) {
                          setBusy(inv.id);
                          await deleteInvoiceAction(inv.id);
                          setBusy(null);
                          router.refresh();
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
