import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Sparkles } from "@/components/ui/icon";
import { formatRelative, statusTone } from "@/lib/format";
import type { HandoffRequest, LeadEvent } from "@/lib/dashboard-data";

export function WorkQueue({
  handoffs,
  leadEvents
}: {
  handoffs: HandoffRequest[];
  leadEvents: LeadEvent[];
}) {
  const total = handoffs.length + leadEvents.length;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Work queue</h3>
        <Badge variant="secondary" size="sm" className="ml-auto">
          {total}
        </Badge>
      </div>

      {total === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          No handoffs or lead events for this conversation.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {handoffs.slice(0, 5).map((h) => (
            <li key={h.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-warning/15 text-warning">
                <UserCog className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{h.reason ?? "Human review requested"}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant={statusTone(h.priority)} size="sm">
                    {h.priority ?? "normal"}
                  </Badge>
                  <span>{formatRelative(h.created_at)}</span>
                </div>
              </div>
            </li>
          ))}

          {leadEvents.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-success/15 text-success">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {e.notes ?? e.event_type.replaceAll("_", " ")}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {(e.score_delta ?? 0) > 0 ? "+" : ""}
                    {e.score_delta ?? 0}
                  </span>
                  <span>·</span>
                  <span>{formatRelative(e.created_at)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
