"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteClientAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import type { ClientInput } from "@/lib/validations";

export function ClientDialog({
  initial,
  triggerLabel,
}: {
  initial?: Partial<ClientInput> & { id?: string };
  triggerLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  return (
    <>
      {isEdit ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> {triggerLabel ?? "Add client"}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? "Edit client" : "Add client"}
        description={
          isEdit
            ? "Update this client's details."
            : "Add a new client to your CRM."
        }
      >
        <ClientForm
          initial={initial}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </>
  );
}

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" /> Delete
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-600">
      Delete {name}?
      <Button
        variant="destructive"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await deleteClientAction(id);
          router.push("/clients");
        }}
      >
        Confirm
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}
