"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  sendOperatorReply,
  setConversationPriority,
  setConversationStatus
} from "@/app/(app)/actions/conversation";
import {
  CONVERSATION_PRIORITY,
  CONVERSATION_STATUS,
  type ConversationPriority,
  type ConversationStatus
} from "@/app/(app)/actions/schemas";

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

// A native <select> that auto-submits its enclosing form when the value changes.
function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  ariaLabel,
  className
}: {
  name: string;
  defaultValue: string;
  options: readonly string[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      onChange={(event) => {
        event.currentTarget.form?.requestSubmit();
      }}
      className={cn(
        "h-7 rounded-md border border-border bg-surface-2 px-2 text-xs capitalize text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labelize(option)}
        </option>
      ))}
    </select>
  );
}

async function statusActionVoid(formData: FormData): Promise<void> {
  const res = await setConversationStatus(formData);
  if (!res.ok) console.error("setConversationStatus:", res.message);
}

async function priorityActionVoid(formData: FormData): Promise<void> {
  const res = await setConversationPriority(formData);
  if (!res.ok) console.error("setConversationPriority:", res.message);
}

export function ConversationStatusMenu({
  conversationId,
  current
}: {
  conversationId: string;
  current: ConversationStatus | null;
}) {
  return (
    <form action={statusActionVoid}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <AutoSubmitSelect
        name="status"
        defaultValue={current ?? "open"}
        options={CONVERSATION_STATUS}
        ariaLabel="Conversation status"
      />
    </form>
  );
}

export function ConversationPriorityMenu({
  conversationId,
  current
}: {
  conversationId: string;
  current: ConversationPriority | null;
}) {
  return (
    <form action={priorityActionVoid}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <AutoSubmitSelect
        name="priority"
        defaultValue={current ?? "normal"}
        options={CONVERSATION_PRIORITY}
        ariaLabel="Conversation priority"
      />
    </form>
  );
}

function ReplySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? "Sending..." : "Send"}
    </Button>
  );
}

type ReplyState = { status: "idle" | "success" | "error"; message: string | null; key: number };

const REPLY_INITIAL: ReplyState = { status: "idle", message: null, key: 0 };

async function replyAction(prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const res = await sendOperatorReply(formData);
  if (res.ok) {
    return { status: "success", message: null, key: prev.key + 1 };
  }
  return { status: "error", message: res.message, key: prev.key };
}

export function ReplyComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useActionState(replyAction, REPLY_INITIAL);

  return (
    <form action={formAction} className="space-y-1.5" key={state.key}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex items-end gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
        <textarea
          name="body"
          required
          rows={1}
          maxLength={1500}
          placeholder="Reply as operator..."
          className="min-h-[36px] w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <ReplySubmitButton />
      </div>
      {state.status === "error" && state.message ? (
        <p className="text-[11px] text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
