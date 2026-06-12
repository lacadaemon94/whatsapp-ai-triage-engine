"use server";

import { revalidatePath } from "next/cache";

import { requireOperator } from "@/lib/auth/require-operator";
import { isDemoMode } from "@/lib/demo/mode";
import { demoUpdateHandoff } from "@/lib/demo/store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { HANDOFF_STATUS, type ActionResult, type HandoffStatus } from "./schemas";

export async function setHandoffStatus(formData: FormData): Promise<ActionResult> {
  await requireOperator();

  const handoffId = String(formData.get("handoffId") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!handoffId) {
    return { ok: false, message: "Missing handoffId." };
  }
  if (!HANDOFF_STATUS.includes(status as HandoffStatus)) {
    return { ok: false, message: `Invalid handoff status '${status}'.` };
  }

  const isTerminal = status === "resolved" || status === "cancelled";
  const now = new Date().toISOString();

  if (isDemoMode()) {
    const result = demoUpdateHandoff(handoffId, {
      status,
      resolved_at: isTerminal ? now : null
    });
    if (!result) {
      return { ok: false, message: "Handoff not found in demo store." };
    }
    revalidatePath("/handoffs");
    revalidatePath("/inbox");
    revalidatePath(`/inbox/${result.conversation_id}`);
    return { ok: true };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("handoff_requests")
    .update({
      status,
      resolved_at: isTerminal ? now : null,
      resolution_notes: notes,
      updated_at: now
    })
    .eq("id", handoffId)
    .select("conversation_id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/handoffs");
  revalidatePath("/inbox");
  if (data?.conversation_id) {
    revalidatePath(`/inbox/${data.conversation_id}`);
  }
  return { ok: true };
}
