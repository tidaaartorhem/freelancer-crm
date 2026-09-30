"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AlertTriangle, Trash2 } from "lucide-react";
import { moveDealAction, deleteDealAction } from "@/app/actions";
import { formatMoney, formatRelative } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DealStage } from "@/db/schema";

export interface KanbanDeal {
  id: string;
  title: string;
  clientName: string;
  valueCents: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: Date | null;
  atRisk: boolean;
}

const COLUMNS: Array<{ id: DealStage; label: string }> = [
  { id: "lead", label: "Lead" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

function DealCard({ deal }: { deal: KanbanDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-white p-3 shadow-sm",
        isDragging ? "z-50 border-zinc-400 opacity-90" : "border-zinc-200",
        deal.stage === "lost" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={`Drag ${deal.title} to another stage`}
          className="flex-1 cursor-grab text-left active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
        >
          <p className="text-sm font-medium text-zinc-900">{deal.title}</p>
        </button>
        <button
          type="button"
          aria-label={`Delete ${deal.title}`}
          className="rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          onClick={async () => {
            if (window.confirm(`Delete "${deal.title}"?`)) {
              await deleteDealAction(deal.id);
            }
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">{deal.clientName}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">
          {formatMoney(deal.valueCents)}
        </span>
        <span className="text-xs text-zinc-500">{deal.probability}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {deal.expectedCloseDate
            ? `Closes ${formatRelative(deal.expectedCloseDate)}`
            : "No close date"}
        </span>
        {deal.atRisk && (
          <Badge variant="danger" className="gap-1">
            <AlertTriangle className="size-3" />
            At risk
          </Badge>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  id,
  label,
  deals,
}: {
  id: DealStage;
  label: string;
  deals: KanbanDeal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = deals.reduce((s, d) => s + d.valueCents, 0);

  return (
    <section
      aria-label={`${label} column`}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-zinc-50/80",
        isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200"
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-800">
          {label}
          <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {deals.length}
          </span>
        </h2>
        <span className="text-xs font-medium text-zinc-500">
          {formatMoney(total)}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className="min-h-32 flex-1 space-y-2 overflow-y-auto px-2 pb-3"
      >
        {deals.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-400">
            Drop deals here
          </p>
        ) : (
          deals.map((d) => <DealCard key={d.id} deal={d} />)
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({ initialDeals }: { initialDeals: KanbanDeal[] }) {
  const [deals, setDeals] = React.useState(initialDeals);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setDeals(initialDeals), [initialDeals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setError(null);
    if (!over) return;
    const dealId = String(active.id);
    const newStage = over.id as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    const prev = deals;
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

    const result = await moveDealAction(dealId, newStage);
    if (!result.ok) {
      setDeals(prev);
      setError(result.error);
    }
  };

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          Couldn't move the deal: {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              deals={deals.filter((d) => d.stage === col.id)}
            />
          ))}
        </div>
      </DndContext>
      <p className="mt-1 text-xs text-zinc-400">
        Tip: drag a card to move it, or focus a card title and use arrow keys
        with the keyboard sensor.
      </p>
    </div>
  );
}
