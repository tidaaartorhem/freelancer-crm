"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResetDemoButton } from "@/components/demo/reset-demo-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Pipeline", icon: KanbanSquare },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/followups", label: "Follow-ups", icon: Bell },
  { href: "/invoices", label: "Invoices", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top bar (mobile) / sidebar (desktop) */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-zinc-900 text-white">
              <Wallet className="size-4" />
            </span>
            Freelancer CRM
          </Link>
          <ResetDemoButton />
        </div>
        <nav aria-label="Primary" className="overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-zinc-200 bg-white lg:block">
          <div className="flex h-full flex-col p-4">
            <Link href="/" className="flex items-center gap-2 px-2 py-3 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-md bg-zinc-900 text-white">
                <Wallet className="size-4" />
              </span>
              <span className="text-[15px]">Freelancer CRM</span>
            </Link>
            <nav aria-label="Primary" className="mt-4 flex-1">
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold text-zinc-900">Demo workspace</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Dates go stale over time — refresh them in one click.
              </p>
              <div className="mt-2">
                <ResetDemoButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
