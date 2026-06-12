import * as React from "react";
import { cn } from "@/lib/utils";
import type { IconComponent } from "@/components/ui/icon";
import { Inbox, UserCog, Sparkles, MessageSquare, AlertTriangle, Send } from "@/components/ui/icon";

type StatTone = "default" | "success" | "warning" | "destructive" | "info" | "muted";

const toneDot: Record<StatTone, string> = {
  default: "bg-muted-foreground/60",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/40"
};

const toneIcon: Record<StatTone, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
  muted: "text-muted-foreground/70"
};

type StatPillProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: IconComponent;
  tone?: StatTone;
};

export function StatPill({ label, value, hint, icon: Icon, tone = "muted" }: StatPillProps) {
  return (
    <div className="inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3">
      <span className="relative flex items-center" aria-hidden>
        <Icon className={cn("h-3.5 w-3.5", toneIcon[tone])} />
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-surface",
            toneDot[tone]
          )}
        />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-[13px] font-semibold leading-none tabular-nums">{value}</span>
      {hint ? <span className="font-mono text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export type DashboardStats = {
  totalConversations: number;
  openConversations: number;
  waitingOnHuman: number;
  highPriority: number;
  newLeadEvents: number;
  outboundTracked: number;
};

function buildPills(stats: DashboardStats) {
  return [
    {
      key: "open",
      label: "Open",
      value: stats.openConversations,
      hint: `/ ${stats.totalConversations}`,
      icon: Inbox,
      tone: "info" as StatTone
    },
    {
      key: "human",
      label: "Needs human",
      value: stats.waitingOnHuman,
      icon: UserCog,
      tone: stats.waitingOnHuman > 0 ? ("destructive" as StatTone) : ("muted" as StatTone)
    },
    {
      key: "leads",
      label: "New leads",
      value: stats.newLeadEvents,
      icon: Sparkles,
      tone: stats.newLeadEvents > 0 ? ("success" as StatTone) : ("muted" as StatTone)
    },
    {
      key: "high",
      label: "High priority",
      value: stats.highPriority,
      icon: AlertTriangle,
      tone: stats.highPriority > 0 ? ("warning" as StatTone) : ("muted" as StatTone)
    },
    {
      key: "conv",
      label: "Conversations",
      value: stats.totalConversations,
      icon: MessageSquare,
      tone: "muted" as StatTone
    },
    {
      key: "out",
      label: "Outbound",
      value: stats.outboundTracked,
      icon: Send,
      tone: "muted" as StatTone
    }
  ];
}

/**
 * Single-row horizontal pill rail at every breakpoint.
 * Pills never wrap — if they don't fit, the row scrolls horizontally.
 * Native scrollbar hidden; bleeds to the page edges on mobile for a swipe-feel.
 */
export function StatsRow({ stats }: { stats: DashboardStats }) {
  const pills = buildPills(stats);

  return (
    <div
      className={cn(
        // Edge-to-edge on mobile so the scroll feels native; reset on md+.
        "-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1",
        "md:mx-0 md:px-0 md:pb-0",
        // Hide the scrollbar — keep the row visually clean. Scroll still works via wheel/swipe.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
      role="list"
      aria-label="Dashboard metrics"
    >
      {pills.map((p) => (
        <div role="listitem" key={p.key}>
          <StatPill label={p.label} value={p.value} hint={p.hint} icon={p.icon} tone={p.tone} />
        </div>
      ))}
    </div>
  );
}

/** Alias kept for callers that still import StatsAligned. Same pill rail. */
export const StatsAligned = StatsRow;
