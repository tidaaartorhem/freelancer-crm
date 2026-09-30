import { listClients } from "@/services/clients";
import { listDeals } from "@/services/deals";
import { listFollowups } from "@/services/followups";
import { PageHeader } from "@/components/ui/page-header";
import { FollowupsClient } from "@/components/followups/followups-client";

export const dynamic = "force-dynamic";

export default async function FollowupsPage() {
  const [followups, deals, clients] = await Promise.all([
    listFollowups(),
    listDeals(),
    listClients(),
  ]);

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Every nudge, reminder, and check-in in one list."
      />
      <FollowupsClient
        followups={followups}
        deals={deals.map((d) => ({ id: d.id, title: d.title }))}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
