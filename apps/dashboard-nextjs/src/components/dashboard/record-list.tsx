import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { displayName, formatRelative, initials, statusTone } from "@/lib/format";
import type { ToneVariant } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RecordItem = {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  badge?: { label: string; tone: ToneVariant };
  metaLeft?: { label: string; mono?: boolean };
  at?: string | null;
  actions?: React.ReactNode;
};

export function RecordList({
  title,
  items,
  emptyCopy,
  eyebrow,
  countSuffix = "recent"
}: {
  title: string;
  items: RecordItem[];
  emptyCopy: string;
  eyebrow?: string;
  countSuffix?: string;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          {eyebrow ? (
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} {countSuffix}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 py-10 text-center text-xs text-muted-foreground">
          {emptyCopy}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <Link href={item.href} className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>{initials(item.contactName, item.contactPhone)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {item.contactName ? displayName(item.contactName, item.contactPhone) : item.title}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {formatRelative(item.at)}
                    </span>
                  </div>
                  {item.subtitle ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {item.badge ? (
                      <Badge variant={item.badge.tone} size="sm">
                        {item.badge.label}
                      </Badge>
                    ) : null}
                    {item.metaLeft ? (
                      <span
                        className={cn(
                          "text-[11px] text-muted-foreground",
                          item.metaLeft.mono && "font-mono tabular-nums"
                        )}
                      >
                        {item.metaLeft.label}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
              {item.actions ? (
                <div className="ml-2 flex shrink-0 items-center gap-1.5 self-center">
                  {item.actions}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export { statusTone };
