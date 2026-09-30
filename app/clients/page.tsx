import { Suspense } from "react";
import Link from "next/link";
import { Building2, Mail, Users } from "lucide-react";
import { listClients } from "@/services/clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ClientDialog } from "@/components/clients/client-dialog";
import { ClientSearch } from "@/components/clients/client-search";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listClients(q);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Every client, their deals, and the full story."
        action={<ClientDialog />}
      />

      <Suspense>
        <ClientSearch />
      </Suspense>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={q ? "No clients match your search" : "No clients yet"}
          description={
            q
              ? "Try a different name, company, or email."
              : "Add your first client to start tracking deals and follow-ups."
          }
          action={!q ? <ClientDialog triggerLabel="Add your first client" /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="h-full transition-colors hover:border-zinc-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900">{c.name}</p>
                      {c.company && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500">
                          <Building2 className="size-3.5" />
                          {c.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                    <Mail className="size-3.5" />
                    {c.email}
                  </p>
                  {c.tags && c.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
