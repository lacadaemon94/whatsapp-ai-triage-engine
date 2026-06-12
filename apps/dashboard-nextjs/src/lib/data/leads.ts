import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetLeadEventsWithContext } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Contact, LeadEvent } from "./types";

export type LeadEventWithContext = LeadEvent & {
  contact: Contact | null;
};

type EmbeddedConversation =
  | { id: string; contacts: Contact | Contact[] | null }
  | Array<{ id: string; contacts: Contact | Contact[] | null }>
  | null;

type Row = LeadEvent & { conversations: EmbeddedConversation };

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

export async function getLeadEventsWithContext(limit = 80): Promise<LeadEventWithContext[]> {
  if (isDemoMode()) return demoGetLeadEventsWithContext(limit);

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("lead_events")
    .select(
      `id, contact_id, conversation_id, message_id, event_type, status, score_delta, notes, created_at,
       conversations:conversations(id, contacts:contacts(id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary))`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load lead_events: ${error.message}`);
  }

  return ((data ?? []) as Row[]).map((row) => {
    const conv = pickConversation(row.conversations);
    return {
      id: row.id,
      contact_id: row.contact_id,
      conversation_id: row.conversation_id,
      message_id: row.message_id,
      event_type: row.event_type,
      status: row.status,
      score_delta: row.score_delta,
      notes: row.notes,
      created_at: row.created_at,
      contact: firstContact(conv?.contacts)
    };
  });
}
