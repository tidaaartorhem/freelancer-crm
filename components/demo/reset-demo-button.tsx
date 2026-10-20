"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { resetDemoDataAction } from "@/app/actions";

/**
 * One-click demo refresh. Wipes the demo workspace and re-seeds it
 * anchored to today, so the live demo never shows stale dates.
 * Destructive for the demo workspace only — asks for confirmation first.
 */
export function ResetDemoButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetDemoDataAction();
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset demo data
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
        title="Reset demo data?"
        description="This wipes the demo workspace and re-seeds it with fresh dates anchored to today. Anything you changed in the demo will be lost."
      >
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Resetting…" : "Reset demo data"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
