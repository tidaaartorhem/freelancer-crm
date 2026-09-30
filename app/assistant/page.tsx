import { listAtRiskDeals } from "@/services/deals";
import { listDrafts } from "@/services/drafts";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantClient } from "@/components/assistant/assistant-client";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const [atRisk, drafts] = await Promise.all([listAtRiskDeals(), listDrafts()]);
  const provider =
    (process.env.AI_PROVIDER ?? "mock").toLowerCase() === "mock"
      ? "built-in mock"
      : process.env.AI_PROVIDER;

  return (
    <div>
      <PageHeader
        title="AI Pipeline Assistant"
        description="Flags at-risk deals, drafts follow-ups, and waits for your approval."
      />
      <AssistantClient atRisk={atRisk} drafts={drafts} providerLabel={provider ?? "mock"} />
    </div>
  );
}
