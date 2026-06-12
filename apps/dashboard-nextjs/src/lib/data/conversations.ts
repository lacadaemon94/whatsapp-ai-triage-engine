import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetConversationList } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Contact, Conversation, ConversationView } from "./types";

const CONVERSATION_COLUMNS =
  "id, contact_id, status, priority, last_message_at, last_intent, summary, external_thread_id, business_phone_number, created_at, updated_at";

const CONTACT_COLUMNS =
  "id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary";

type ConversationRow = Conversation & {
  contacts: Contact | Contact[] | null;
};

function firstContact(value: ConversationRow["contacts"]): Contact | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// List view for the inbox + per-section sidebars. Returns conversation rows + the
// embedded contact. We deliberately do NOT join messages or ai_classifications --
// the UI falls back to conversations.last_intent / summary / last_message_at, all
// kept up to date by the ingest + classification SQL functions.
export async function getConversationListItems(limit = 60): Promise<ConversationView[]> {
  if (isDemoMode()) return demoGetConversationList(limit);

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(`${CONVERSATION_COLUMNS}, contacts:contacts(${CONTACT_COLUMNS})`)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load conversation list: ${error.message}`);
  }

  return ((data ?? []) as ConversationRow[]).map((row) => ({
    ...row,
    contact: firstContact(row.contacts),
    latestMessage: null,
    messages: [],
    latestClassification: null,
    handoffs: [],
    leadEvents: []
  }));
}
