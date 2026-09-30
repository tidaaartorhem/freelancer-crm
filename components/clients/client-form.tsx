"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { createClientAction, updateClientAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientFormProps {
  initial?: Partial<ClientInput> & { id?: string };
  onDone: () => void;
}

export function ClientForm({ initial, onDone }: ClientFormProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema) as unknown as Resolver<ClientInput>,
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      company: initial?.company ?? "",
      phone: initial?.phone ?? "",
      website: initial?.website ?? "",
      notes: initial?.notes ?? "",
      tags: initial?.tags ?? [],
    },
  });

  const onSubmit = async (values: ClientInput) => {
    setServerError(null);
    const result = initial?.id
      ? await updateClientAction(initial.id, values)
      : await createClientAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onDone();
  };

  const err = (name: keyof ClientInput) =>
    errors[name] ? (
      <p role="alert" className="text-xs text-red-600">
        {(errors[name] as { message?: string })?.message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-name">Name</Label>
          <Input id="client-name" {...register("name")} autoComplete="name" />
          {err("name")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            {...register("email")}
            autoComplete="email"
          />
          {err("email")}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-company">Company</Label>
          <Input id="client-company" {...register("company")} />
          {err("company")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-phone">Phone</Label>
          <Input id="client-phone" type="tel" {...register("phone")} />
          {err("phone")}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-website">Website</Label>
        <Input
          id="client-website"
          placeholder="https://"
          {...register("website")}
        />
        {err("website")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-tags">Tags (comma-separated)</Label>
        <Input
          id="client-tags"
          placeholder="retainer, saas"
          defaultValue={(initial?.tags ?? []).join(", ")}
          onChange={(e) =>
            setValue(
              "tags",
              e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
              { shouldValidate: true }
            )
          }
        />
        {err("tags")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-notes">Notes</Label>
        <Textarea id="client-notes" {...register("notes")} rows={3} />
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
          {isSubmitting
            ? "Saving…"
            : initial?.id
              ? "Save changes"
              : "Add client"}
        </Button>
      </div>
    </form>
  );
}
