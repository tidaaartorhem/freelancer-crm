"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealSchema, type DealInput } from "@/lib/validations";
import { createDealAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DealFormProps {
  clients: Array<{ id: string; name: string }>;
  defaultStage?: string;
  onDone: () => void;
}

export function DealForm({ clients, defaultStage, onDone }: DealFormProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealInput>({
    resolver: zodResolver(dealSchema) as unknown as Resolver<DealInput>,
    defaultValues: {
      stage: (defaultStage as DealInput["stage"]) ?? "lead",
      probability: 50,
    },
  });

  const onSubmit = async (values: DealInput) => {
    setServerError(null);
    // valueCents is entered in dollars in this form; schema coerces
    const payload = {
      ...values,
      valueCents: Math.round(Number(values.valueCents) * 100),
    };
    const result = await createDealAction(payload);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onDone();
  };

  const err = (name: keyof DealInput) =>
    errors[name] ? (
      <p role="alert" className="text-xs text-red-600">
        {(errors[name] as { message?: string })?.message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="deal-title">Deal title</Label>
        <Input
          id="deal-title"
          {...register("title")}
          placeholder="e.g. Website redesign"
        />
        {err("title")}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="deal-client">Client</Label>
          <Select id="deal-client" {...register("clientId")}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {err("clientId")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-stage">Stage</Label>
          <Select id="deal-stage" {...register("stage")}>
            <option value="lead">Lead</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
          {err("stage")}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="deal-value">Value (USD)</Label>
          <Input
            id="deal-value"
            type="number"
            min={0}
            step="any"
            {...register("valueCents")}
            placeholder="5000"
          />
          {err("valueCents")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-probability">Probability %</Label>
          <Input
            id="deal-probability"
            type="number"
            min={0}
            max={100}
            {...register("probability")}
          />
          {err("probability")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-close">Expected close</Label>
          <Input id="deal-close" type="date" {...register("expectedCloseDate")} />
          {err("expectedCloseDate")}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deal-notes">Notes</Label>
        <Textarea id="deal-notes" {...register("notes")} rows={3} />
        {err("notes")}
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add deal"}
        </Button>
      </div>
    </form>
  );
}
