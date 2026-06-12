import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { displayName, formatRelative, initials, intentMeta, statusTone } from "@/lib/format";
import type { ConversationView } from "@/lib/dashboard-data";

type Props = {
  conversations: ConversationView[];
  selectedId: string | null;
};

export function ConversationList({ conversations, selectedId }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Inbox</h2>
          <Badge variant="secondary" size="sm">
            {conversations.length}
          </Badge>
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-auto">
        {conversations.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground">
            No conversations yet.
          </li>
        ) : (
          conversations.map((c) => {
            const active = c.id === selectedId;
            const name = displayName(c.contact?.display_name, c.contact?.phone_number);
            const intent = intentMeta(c.latestClassification?.intent ?? c.last_intent);
            const IntentIcon = intent.icon;
            const preview = c.latestMessage?.body || c.summary || "No preview yet";

            return (
              <li key={c.id} className="relative">
                {active ? (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-primary" aria-hidden />
                ) : null}
                <Link
                  href={`/inbox/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2",
                    active && "bg-surface-2"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(c.contact?.display_name, c.contact?.phone_number)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {formatRelative(c.last_message_at ?? c.latestMessage?.sent_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={intent.tone} size="sm" className="gap-1">
                        <IntentIcon className="h-2.5 w-2.5" />
                        {intent.label}
                      </Badge>
                      {c.status ? (
                        <Badge variant={statusTone(c.status)} size="sm">
                          {c.status.replaceAll("_", " ")}
                        </Badge>
                      ) : null}
                      {c.priority === "high" ? (
                        <Badge variant="destructive" size="sm">
                          high
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
