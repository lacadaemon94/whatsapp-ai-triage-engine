import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check, CheckCheck, Clock, MoreHorizontal, AlertTriangle, ChevronLeft } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  dayKey,
  displayName,
  formatDateTime,
  formatDay,
  initials,
  intentMeta
} from "@/lib/format";
import type { ConversationView, Message } from "@/lib/dashboard-data";
import {
  ConversationPriorityMenu,
  ConversationStatusMenu,
  ReplyComposer
} from "@/components/dashboard/conversation-actions";
import type {
  ConversationPriority,
  ConversationStatus
} from "@/app/(app)/actions/schemas";

function DeliveryIcon({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  if (status === "read") return <CheckCheck className="h-3 w-3 text-info" aria-label="Read" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" aria-label="Delivered" />;
  if (status === "sent") return <Check className="h-3 w-3 text-muted-foreground" aria-label="Sent" />;
  if (status === "queued") return <Clock className="h-3 w-3 text-muted-foreground" aria-label="Queued" />;
  if (status === "failed" || status === "undelivered")
    return <AlertTriangle className="h-3 w-3 text-destructive" aria-label="Failed" />;
  return null;
}

function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === "outbound";
  return (
    <div className={cn("flex w-full", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-xs",
          outbound
            ? "rounded-br-md bg-primary/15 text-foreground"
            : "rounded-bl-md border border-border bg-surface-2 text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body || "—"}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span className="font-mono tabular-nums">
            {new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
              new Date(message.sent_at ?? message.created_at ?? Date.now())
            )}
          </span>
          {outbound ? <DeliveryIcon status={message.delivery_status} /> : null}
        </div>
      </div>
    </div>
  );
}

function DayDivider({ value }: { value: string | null | undefined }) {
  return (
    <div className="my-2 flex items-center justify-center">
      <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {formatDay(value)}
      </span>
    </div>
  );
}

export function ConversationDetail({
  conversation,
  detailsSlot
}: {
  conversation: ConversationView;
  detailsSlot?: React.ReactNode;
}) {
  const name = displayName(conversation.contact?.display_name, conversation.contact?.phone_number);
  const intent = intentMeta(conversation.latestClassification?.intent ?? conversation.last_intent);
  const IntentIcon = intent.icon;

  const grouped: Array<{ key: string; at: string | null; messages: Message[] }> = [];
  for (const m of conversation.messages) {
    const k = dayKey(m.sent_at ?? m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.key === k) last.messages.push(m);
    else grouped.push({ key: k, at: m.sent_at ?? m.created_at, messages: [m] });
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-start gap-3 border-b border-border px-3 py-3 sm:px-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Back to inbox">
          <Link href="/inbox">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback>{initials(conversation.contact?.display_name, conversation.contact?.phone_number)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{name}</h2>
            <div className="flex shrink-0 items-center gap-1">
              {detailsSlot}
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ConversationStatusMenu
              conversationId={conversation.id}
              current={conversation.status as ConversationStatus | null}
            />
            <ConversationPriorityMenu
              conversationId={conversation.id}
              current={conversation.priority as ConversationPriority | null}
            />
            <Badge variant={intent.tone} size="sm" className="gap-1">
              <IntentIcon className="h-2.5 w-2.5" />
              {intent.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">{conversation.contact?.phone_number?.replace("whatsapp:", "") ?? "—"}</span>
            <span aria-hidden>·</span>
            <span>
              Lead score{" "}
              <span className="font-mono tabular-nums text-foreground">
                {conversation.contact?.lead_score ?? 0}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Optional summary line — small, in-context, not its own panel */}
      {conversation.summary || conversation.contact?.conversation_summary ? (
        <div className="shrink-0 border-b border-border bg-surface-2/60 px-4 py-2">
          <p className="line-clamp-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Summary · </span>
            {conversation.summary ?? conversation.contact?.conversation_summary}
          </p>
        </div>
      ) : null}

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        {conversation.messages.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            No messages loaded.
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
            {grouped.map((g) => (
              <React.Fragment key={g.key}>
                <DayDivider value={g.at} />
                {g.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
        <ReplyComposer conversationId={conversation.id} />
        <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
          Last message {formatDateTime(conversation.last_message_at ?? conversation.latestMessage?.sent_at)}
        </p>
      </div>
    </div>
  );
}
