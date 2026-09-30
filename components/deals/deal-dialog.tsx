"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DealForm } from "./deal-form";

export function DealDialog({
  clients,
  defaultStage,
}: {
  clients: Array<{ id: string; name: string }>;
  defaultStage?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add deal
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add deal"
        description="Track a new opportunity in your pipeline."
      >
        <DealForm
          clients={clients}
          defaultStage={defaultStage}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </>
  );
}
