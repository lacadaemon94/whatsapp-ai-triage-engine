"use server";

import { revalidatePath } from "next/cache";

import { requireOperator } from "@/lib/auth/require-operator";
import { isDemoMode } from "@/lib/demo/mode";
import { demoUpdateLeadEvent } from "@/lib/demo/store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { LEAD_EVENT_STATUS, type ActionResult, type LeadEventStatus } from "./schemas";

export async function setLeadEventStatus(formData: FormData): Promise<ActionResult> {
  await requireOperator();

  const leadEventId = String(formData.get("leadEventId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!leadEventId) {
    return { ok: false, message: "Missing leadEventId." };
  }
  if (!LEAD_EVENT_STATUS.includes(status as LeadEventStatus)) {
    return { ok: false, message: `Invalid lead event status '${status}'.` };
  }

  if (isDemoMode()) {
    const result = demoUpdateLeadEvent(leadEventId, { status });
    if (!result) {
      return { ok: false, message: "Lead event not found in demo store." };
    }
    revalidatePath("/leads");
    revalidatePath("/inbox");
    revalidatePath(`/inbox/${result.conversation_id}`);
    return { ok: true };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("lead_events")
    .update({ status })
    .eq("id", leadEventId)
    .select("conversation_id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/inbox");
  if (data?.conversation_id) {
    revalidatePath(`/inbox/${data.conversation_id}`);
  }
  return { ok: true };
}
