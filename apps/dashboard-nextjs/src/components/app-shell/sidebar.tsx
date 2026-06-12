"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS, isItemActive } from "./nav-items";
import { useSidebar } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { expanded, toggle } = useSidebar();

  return (
    <aside
      data-expanded={expanded}
      className={cn(
        // Hidden on mobile (hamburger sheet from Topbar takes over).
        // On md+: rounded floating panel, full height of parent flex container.
        "hidden md:flex md:flex-col md:rounded-2xl md:border md:border-border md:bg-surface md:py-3",
        "md:transition-[width] md:duration-200",
        expanded ? "md:w-56 md:items-stretch md:px-3" : "md:w-14 md:items-center md:px-2"
      )}
    >
      <div className={cn("flex h-9 items-center", expanded ? "justify-between" : "justify-center")}>
        <Link href="/inbox" className="flex items-center gap-2 text-foreground" aria-label="WhatsApp AI Triage">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-[11px] font-extrabold tracking-tight">WA</span>
          </span>
          {expanded ? <span className="text-sm font-semibold">AI Triage</span> : null}
        </Link>
        {expanded ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav
        className={cn("mt-4 flex flex-1 flex-col gap-1", expanded ? "items-stretch" : "items-center")}
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item);
          const Icon = item.icon;

          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center rounded-xl text-muted-foreground transition-colors",
                "hover:bg-surface-2 hover:text-foreground",
                active && "bg-surface-2 text-foreground",
                expanded ? "h-9 w-full gap-3 px-2.5 text-sm font-medium" : "h-9 w-9 justify-center"
              )}
            >
              {active ? (
                <span className="absolute -left-2 h-5 w-[3px] rounded-r-full bg-primary" aria-hidden />
              ) : null}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {expanded ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
            </Link>
          );

          return expanded ? (
            <React.Fragment key={item.href}>{link}</React.Fragment>
          ) : (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className={cn("flex items-center gap-1", expanded ? "justify-between" : "flex-col justify-center")}>
        <ThemeToggle />
        {!expanded ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                aria-label="Expand sidebar"
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </aside>
  );
}
