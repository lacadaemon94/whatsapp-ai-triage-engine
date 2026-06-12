import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { RealtimeStatusProvider } from "@/components/realtime/realtime-status-context";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { Topbar } from "./topbar";

export function AppShell({
  children,
  loadedAt
}: {
  children: React.ReactNode;
  loadedAt?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <RealtimeStatusProvider>
        <SidebarProvider>
          {/* Outer shell — body padding (24px mobile, 48px desktop), sidebar + content as
              sibling floating panels that bottom-align via the parent flex h-svh. */}
          <div className="flex h-svh gap-3 overflow-hidden bg-background p-3 min-[481px]:p-6">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
              <Topbar loadedAt={loadedAt} />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </main>
          </div>
          <RealtimeRefresher />
        </SidebarProvider>
      </RealtimeStatusProvider>
    </TooltipProvider>
  );
}
