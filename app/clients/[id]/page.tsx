import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Calendar, Mail, Phone, Globe, StickyNote, Users } from "lucide-react";
import { getClient } from "@/services/clients";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ClientDialog, DeleteClientButton } from "@/components/clients/client-dialog";
import { ActivityForm } from "@/components/clients/activity-form";

export const dynamic = "force-dynamic";

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  note: <StickyNote className="size-3.5 text-zinc-400" />,
  email: <Mail className="size-3.5 text-zinc-400" />,
  call: <Phone className="size-3.5 text-zinc-400" />,
  meeting: <Users className="size-3.5 text-zinc-400" />,
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClient(id);
  if (!data) notFound();

  const { client, deals, timeline } = data;

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company ?? "Client"}
        action={
          <div className="flex items-center gap-2">
            <ClientDialog
              initial={{
                id: client.id,
                name: client.name,
                email: client.email,
                company: client.company ?? "",
                phone: client.phone ?? "",
                website: client.website ?? "",
                notes: client.notes ?? "",
                tags: client.tags ?? [],
              }}
            />
            <DeleteClientButton id={client.id} name={client.name} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2 text-zinc-600">
                <Mail className="size-4 text-zinc-400" />
                <a href={`mailto:${client.email}`} className="hover:underline">
                  {client.email}
                </a>
              </p>
              {client.phone && (
                <p className="flex items-center gap-2 text-zinc-600">
                  <Phone className="size-4 text-zinc-400" />
                  {client.phone}
                </p>
              )}
              {client.website && (
                <p className="flex items-center gap-2 text-zinc-600">
                  <Globe className="size-4 text-zinc-400" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              {client.company && (
                <p className="flex items-center gap-2 text-zinc-600">
                  <Building2 className="size-4 text-zinc-400" />
                  {client.company}
                </p>
              )}
              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {client.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              {client.notes && (
                <p className="pt-2 text-sm text-zinc-600">{client.notes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deals ({deals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-zinc-500">No deals yet.</p>
              ) : (
                <ul className="space-y-2">
                  {deals.map((d) => (
                    <li key={d.id}>
                      <Link
                        href="/deals"
                        className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 p-2.5 text-sm hover:border-zinc-300"
                      >
                        <span className="font-medium text-zinc-900">
                          {d.title}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">{d.stage}</Badge>
                          <span className="font-semibold">
                            {formatMoney(d.valueCents)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ActivityForm clientId={client.id} />
              {timeline.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="size-5" />}
                  title="No activity yet"
                  description="Log the first note, call, or email to start the timeline."
                />
              ) : (
                <ol className="relative space-y-4 border-l border-zinc-200 pl-5">
                  {timeline.map((a) => (
                    <li key={a.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[27px] flex size-4 items-center justify-center bg-white"
                      >
                        {ACTIVITY_ICON[a.type] ?? "•"}
                      </span>
                      <p className="text-sm font-medium text-zinc-900">
                        {a.subject}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {a.type} · {formatDate(a.occurredAt)} (
                        {formatRelative(a.occurredAt)})
                      </p>
                      {a.body && (
                        <p className="mt-1 text-sm text-zinc-600">{a.body}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
