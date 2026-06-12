import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetHandoffsWithContext } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Contact, HandoffRequest } from "./types";

export type HandoffWithContext = HandoffRequest & {
  contact: Contact | null;
};

type EmbeddedConversation =
  | { id: string; contacts: Contact | Contact[] | null }
  | Array<{ id: string; contacts: Contact | Contact[] | null }>
  | null;

type Row = HandoffRequest & { conversations: EmbeddedConversation };

function firstContact(value: Contact | Contact[] | null | undefined): Contact | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function pickConversation(value: EmbeddedConversation) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Handoff rows with the contact (via conversation) flattened in. Single round trip.
export async function getHandoffsWithContext(limit = 80): Promise<HandoffWithContext[]> {
  if (isDemoMode()) return demoGetHandoffsWithContext(limit);

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("handoff_requests")
    .select(
      `id, contact_id, conversation_id, message_id, status, reason, priority, requested_by, created_at, resolved_at,
       conversations:conversations(id, contacts:contacts(id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary))`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load handoff_requests: ${error.message}`);
  }

  return ((data ?? []) as Row[]).map((row) => {
    const conv = pickConversation(row.conversations);
    return {
      id: row.id,
      contact_id: row.contact_id,
      conversation_id: row.conversation_id,
      message_id: row.message_id,
      status: row.status,
      reason: row.reason,
      priority: row.priority,
      requested_by: row.requested_by,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      contact: firstContact(conv?.contacts)
    };
  });
}
