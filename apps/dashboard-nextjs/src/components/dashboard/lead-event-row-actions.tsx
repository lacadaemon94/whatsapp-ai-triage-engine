"use client";

import * as React from "react";
import { useActionState } from "react";

import { cn } from "@/lib/utils";
import { setLeadEventStatus } from "@/app/(app)/actions/lead-event";
import { LEAD_EVENT_STATUS } from "@/app/(app)/actions/schemas";

type State = { error: string | null };
const INITIAL: State = { error: null };

async function updateAction(_prev: State, formData: FormData): Promise<State> {
  const res = await setLeadEventStatus(formData);
  return { error: res.ok ? null : res.message };
}

export function LeadEventStatusSelect({
  leadEventId,
  current
}: {
  leadEventId: string;
  current: string | null;
}) {
  const [state, formAction] = useActionState(updateAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="leadEventId" value={leadEventId} />
      <select
        name="status"
        defaultValue={current ?? "new"}
        aria-label="Lead event status"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          "h-7 rounded-md border border-border bg-surface-2 px-2 text-xs capitalize text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {LEAD_EVENT_STATUS.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      {state.error ? (
        <span className="text-[10px] text-destructive" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
