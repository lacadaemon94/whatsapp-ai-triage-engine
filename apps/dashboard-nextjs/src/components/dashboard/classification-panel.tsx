import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "@/components/ui/icon";
import { confidencePercent, intentMeta, statusTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Classification } from "@/lib/dashboard-data";

function ConfidenceMeter({ value }: { value: number | null }) {
  const pct = value ?? 0;
  const tone = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-info" : "bg-warning";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-mono tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ClassificationPanel({ classification }: { classification: Classification | null }) {
  if (!classification) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">AI classification</h3>
          <Badge variant="muted" size="sm" className="ml-auto">
            Pending
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No classification saved for this conversation yet.
        </p>
      </Card>
    );
  }

  const intent = intentMeta(classification.intent);
  const IntentIcon = intent.icon;
  const pct = confidencePercent(classification.confidence);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className={cn("grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary")} aria-hidden>
          <IntentIcon className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{intent.label}</span>
          {classification.model ? (
            <span className="truncate font-mono text-[10px] text-muted-foreground">{classification.model}</span>
          ) : null}
        </div>
        <Badge variant={statusTone(classification.urgency)} size="sm" className="ml-auto capitalize">
          {classification.urgency ?? "medium"}
        </Badge>
      </div>

      <div className="space-y-3 px-4 py-3">
        <ConfidenceMeter value={pct} />

        {classification.summary ? (
          <p className="text-xs leading-relaxed text-foreground/85">{classification.summary}</p>
        ) : null}

        {classification.recommended_action ? (
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Recommended action
            </div>
            <div className="mt-1 text-xs font-medium">
              {classification.recommended_action.replaceAll("_", " ")}
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled className="h-7 text-xs">
                Apply
              </Button>
              <Button size="sm" variant="outline" disabled className="h-7 text-xs">
                <RefreshCw className="h-3 w-3" /> Re-classify
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
