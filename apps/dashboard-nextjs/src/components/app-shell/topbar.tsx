"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRealtimeStatus } from "@/components/realtime/realtime-status-context";
import { NAV_ITEMS, isItemActive } from "./nav-items";
import { cn } from "@/lib/utils";

type TopbarProps = {
  loadedAt?: string;
  envLabel?: string;
};

function sectionTitle(pathname: string | null) {
  if (!pathname) return "Inbox";
  if (pathname.startsWith("/leads")) return "Leads";
  if (pathname.startsWith("/handoffs")) return "Handoffs";
  if (pathname.startsWith("/activity")) return "Activity";
  return "Inbox";
}

const LIVE_LABEL: Record<"connecting" | "live" | "disconnected", string> = {
  connecting: "Connecting",
  live: "Live",
  disconnected: "Offline"
};

export function Topbar({
  loadedAt: _loadedAt,
  envLabel = process.env.NEXT_PUBLIC_ENV_LABEL ?? "Demo"
}: TopbarProps) {
  const pathname = usePathname();
  const title = sectionTitle(pathname);
  const realtimeStatus = useRealtimeStatus();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const liveLabel = LIVE_LABEL[realtimeStatus];
  const liveDotClass =
    realtimeStatus === "live"
      ? "bg-success"
      : realtimeStatus === "connecting"
        ? "bg-warning"
        : "bg-destructive";
  const livePingClass =
    realtimeStatus === "live"
      ? "bg-success/70 opacity-70 animate-ping"
      : realtimeStatus === "connecting"
        ? "bg-warning/70 opacity-70 animate-ping"
        : "bg-transparent";

  // Close the mobile menu when the route changes (e.g. user taps a nav item).
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 md:px-5">
      {/* Mobile-left: hamburger menu, always available */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="left-4 top-4 bottom-4 h-auto w-[17rem] rounded-2xl border-border p-0 shadow-2xl"
        >
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-foreground">
                <span className="text-[10px] font-extrabold tracking-tight">WA</span>
              </span>
              AI Triage
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 p-2" aria-label="Mobile">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    active && "bg-surface-2 text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-base font-semibold leading-none">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search — collapses to icon below xl */}
        <div className="relative hidden xl:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="h-8 w-56 border-transparent bg-surface-2 pl-8 text-xs shadow-none focus-visible:border-border focus-visible:bg-surface"
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none gap-1 rounded border border-border bg-surface px-1 font-mono text-[10px] text-muted-foreground xl:inline-flex">
            ⌘K
          </kbd>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 xl:hidden"
          aria-label="Search"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Env + realtime indicator — dot reflects the supabase realtime channel state. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="hidden h-8 items-center gap-1.5 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-surface-2 hover:text-foreground md:inline-flex"
              aria-label={`Realtime ${liveLabel} · ${envLabel}`}
            >
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className={cn("absolute inline-flex h-full w-full rounded-full", livePingClass)} />
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", liveDotClass)} />
              </span>
              {liveLabel}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono">
            {envLabel}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile search overlay */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="border-b border-border p-3" hideClose>
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search conversations, leads…"
              className="h-10 pl-9"
              aria-label="Global search"
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
