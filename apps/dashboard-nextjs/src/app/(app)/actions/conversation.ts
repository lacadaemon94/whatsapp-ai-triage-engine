"use server";

import { revalidatePath } from "next/cache";

import { requireOperator } from "@/lib/auth/require-operator";
import { isDemoMode } from "@/lib/demo/mode";
import {
  demoAppendOutboundMessage,
  demoUpdateConversation
} from "@/lib/demo/store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  CONVERSATION_PRIORITY,
  CONVERSATION_STATUS,
  type ActionResult,
  type ConversationPriority,
  type ConversationStatus
} from "./schemas";

function readId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function setConversationStatus(formData: FormData): Promise<ActionResult> {
  await requireOperator();

  const conversationId = readId(formData, "conversationId");
  const status = String(formData.get("status") ?? "");

  if (!conversationId) {
    return { ok: false, message: "Missing conversationId." };
  }
  if (!CONVERSATION_STATUS.includes(status as ConversationStatus)) {
    return { ok: false, message: `Invalid status '${status}'.` };
  }

  if (isDemoMode()) {
    if (!demoUpdateConversation(conversationId, { status })) {
      return { ok: false, message: "Conversation not found in demo store." };
    }
    revalidatePath("/inbox");
    revalidatePath(`/inbox/${conversationId}`);
    revalidatePath("/handoffs");
    return { ok: true };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/handoffs");
  return { ok: true };
}

export async function setConversationPriority(formData: FormData): Promise<ActionResult> {
  await requireOperator();

  const conversationId = readId(formData, "conversationId");
  const priority = String(formData.get("priority") ?? "");

  if (!conversationId) {
    return { ok: false, message: "Missing conversationId." };
  }
  if (!CONVERSATION_PRIORITY.includes(priority as ConversationPriority)) {
    return { ok: false, message: `Invalid priority '${priority}'.` };
  }

  if (isDemoMode()) {
    if (!demoUpdateConversation(conversationId, { priority })) {
      return { ok: false, message: "Conversation not found in demo store." };
    }
    revalidatePath("/inbox");
    revalidatePath(`/inbox/${conversationId}`);
    return { ok: true };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("conversations")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  return { ok: true };
}

// Operator-typed reply -- posted through the existing n8n outbound webhook so it goes
// out via Twilio and gets logged into public.messages by the same workflow that handles
// AI replies. The n8n workflow needs to accept sender_type / source so it tags the
// resulting messages row as human-typed.
export async function sendOperatorReply(formData: FormData): Promise<ActionResult> {
  const operator = await requireOperator();

  const conversationId = readId(formData, "conversationId");
  const body = String(formData.get("body") ?? "").trim();

  if (!conversationId) {
    return { ok: false, message: "Missing conversationId." };
  }
  if (!body) {
    return { ok: false, message: "Reply body is empty." };
  }
  if (body.length > 1500) {
    return { ok: false, message: "Reply is too long (1500 chars max)." };
  }

  if (isDemoMode()) {
    const msg = demoAppendOutboundMessage(conversationId, body, "human");
    if (!msg) {
      return { ok: false, message: "Conversation not found in demo store." };
    }
    revalidatePath("/inbox");
    revalidatePath(`/inbox/${conversationId}`);
    return { ok: true };
  }

  const webhookUrl = process.env.N8N_OUTBOUND_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, message: "N8N_OUTBOUND_WEBHOOK_URL is not configured." };
  }

  const admin = getSupabaseAdmin();
  const { data: conversation, error: lookupError } = await admin
    .from("conversations")
    .select("id, business_phone_number, contacts:contacts(phone_number, display_name)")
    .eq("id", conversationId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, message: lookupError.message };
  }
  if (!conversation) {
    return { ok: false, message: "Conversation not found." };
  }

  const contactRow = Array.isArray(conversation.contacts)
    ? conversation.contacts[0]
    : conversation.contacts;

  if (!contactRow?.phone_number) {
    return { ok: false, message: "No contact phone number on file for this conversation." };
  }

  const payload = {
    source: "operator_dashboard",
    sender_type: "human",
    conversation_id: conversation.id,
    operator_email: operator.email,
    to: contactRow.phone_number,
    from: conversation.business_phone_number,
    body
  };

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch (err) {
    return {
      ok: false,
      message: `Could not reach outbound webhook: ${(err as Error).message}`
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      ok: false,
      message: `Outbound webhook returned ${response.status} ${response.statusText}${text ? `: ${text.slice(0, 240)}` : ""}`
    };
  }

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  return { ok: true };
}
