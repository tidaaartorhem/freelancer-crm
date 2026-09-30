import { listClients } from "@/services/clients";
import { listDeals } from "@/services/deals";
import { listInvoices } from "@/services/invoices";
import { PageHeader } from "@/components/ui/page-header";
import { InvoicesClient } from "@/components/invoices/invoices-client";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, deals, clients] = await Promise.all([
    listInvoices(),
    listDeals("won"),
    listClients(),
  ]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Bill won deals and track what's outstanding."
      />
      <InvoicesClient
        invoices={invoices}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        wonDeals={deals.map((d) => ({
          id: d.id,
          title: d.title,
          clientId: d.clientId,
          valueCents: d.valueCents,
        }))}
      />
    </div>
  );
}
