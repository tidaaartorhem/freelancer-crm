"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { activitySchema, type ActivityInput } from "@/lib/validations";
import { logActivityAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ActivityForm({
  clientId,
  dealId,
  onDone,
}: {
  clientId?: string;
  dealId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: { clientId: clientId ?? "", dealId: dealId ?? "", type: "note" },
  });

  const onSubmit = async (values: ActivityInput) => {
    setServerError(null);
    const result = await logActivityAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="activity-type">Type</Label>
          <Select id="activity-type" {...register("type")}>
            <option value="note">Note</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-subject">Subject</Label>
          <Input
            id="activity-subject"
            {...register("subject")}
            placeholder="What happened?"
          />
          {errors.subject && (
            <p role="alert" className="text-xs text-red-600">
              {errors.subject.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="activity-body">Details</Label>
        <Textarea id="activity-body" {...register("body")} rows={3} />
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Log activity"}
        </Button>
      </div>
    </form>
  );
}
