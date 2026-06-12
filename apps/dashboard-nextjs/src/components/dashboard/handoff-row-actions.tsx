"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { setHandoffStatus } from "@/app/(app)/actions/handoff";

type State = { error: string | null };
const INITIAL: State = { error: null };

async function resolveAction(_prev: State, formData: FormData): Promise<State> {
  formData.set("status", "resolved");
  const res = await setHandoffStatus(formData);
  return { error: res.ok ? null : res.message };
}

function ResolveButton({ isOpen }: { isOpen: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending || !isOpen} className="h-7 text-xs">
      {pending ? "Resolving..." : isOpen ? "Resolve" : "Resolved"}
    </Button>
  );
}

export function HandoffResolveButton({
  handoffId,
  currentStatus
}: {
  handoffId: string;
  currentStatus: string | null;
}) {
  const [state, formAction] = useActionState(resolveAction, INITIAL);
  const isOpen = currentStatus !== "resolved" && currentStatus !== "cancelled";

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="handoffId" value={handoffId} />
      <ResolveButton isOpen={isOpen} />
      {state.error ? (
        <span className="text-[10px] text-destructive" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
