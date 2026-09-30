import { listClients } from "@/services/clients";
import { listAtRiskDeals, listDeals } from "@/services/deals";
import { PageHeader } from "@/components/ui/page-header";
import { KanbanBoard, type KanbanDeal } from "@/components/deals/kanban-board";
import { DealDialog } from "@/components/deals/deal-dialog";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [deals, clients, atRisk] = await Promise.all([
    listDeals(),
    listClients(),
    listAtRiskDeals(),
  ]);
  const atRiskIds = new Set(atRisk.map((d) => d.id));

  const kanbanDeals: KanbanDeal[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    clientName: d.clientName,
    valueCents: d.valueCents,
    stage: d.stage,
    probability: d.probability,
    expectedCloseDate: d.expectedCloseDate,
    atRisk: atRiskIds.has(d.id),
  }));

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag deals through stages. At-risk deals are flagged automatically."
        action={
          <DealDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
        }
      />
      <KanbanBoard initialDeals={kanbanDeals} />
    </div>
  );
}
