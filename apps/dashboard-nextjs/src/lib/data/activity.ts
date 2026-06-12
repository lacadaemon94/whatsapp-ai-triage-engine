import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetActivityFeed } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Classification, Contact, Message } from "./types";

type EmbeddedConversation =
  | { id: string; contacts: Contact | Contact[] | null }
  | Array<{ id: string; contacts: Contact | Contact[] | null }>
  | null;

type MessageRow = Message & { conversations: EmbeddedConversation };
type ClassificationRow = Classification & { conversations: EmbeddedConversation };

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

export type ActivityMessage = Message & { contact: Contact | null };
export type ActivityClassification = Classification & { contact: Contact | null };

export type ActivityFeed = {
  messages: ActivityMessage[];
  classifications: ActivityClassification[];
};

// Two parallel queries -- messages and classifications -- both with the embedded
// contact (via conversation). The activity page merges + sorts client-side and
// slices to the limit. Per-side limit is half the surfaced count so the merged
// view is well-stocked but bounded.
export async function getActivityFeed(limit = 120): Promise<ActivityFeed> {
  if (isDemoMode()) return demoGetActivityFeed(limit);

  const supabase = await getSupabaseServerClient();

  const perSide = Math.max(Math.ceil(limit / 1.5), 40);

  const messagesPromise = supabase
    .from("messages")
    .select(
      `id, conversation_id, contact_id, direction, sender_type, body, sent_at, created_at, delivery_status,
       conversations:conversations(id, contacts:contacts(id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary))`
    )
    .order("sent_at", { ascending: false })
    .limit(perSide);

  const classificationsPromise = supabase
    .from("ai_classifications")
    .select(
      `id, message_id, conversation_id, contact_id, intent, confidence, urgency, summary, recommended_action, model, created_at,
       conversations:conversations(id, contacts:contacts(id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary))`
    )
    .order("created_at", { ascending: false })
    .limit(perSide);

  const [messagesRes, classificationsRes] = await Promise.all([messagesPromise, classificationsPromise]);

  if (messagesRes.error) throw new Error(`Could not load messages: ${messagesRes.error.message}`);
  if (classificationsRes.error)
    throw new Error(`Could not load ai_classifications: ${classificationsRes.error.message}`);

  const messages = ((messagesRes.data ?? []) as MessageRow[]).map((row) => {
    const conv = pickConversation(row.conversations);
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      contact_id: row.contact_id,
      direction: row.direction,
      sender_type: row.sender_type,
      body: row.body,
      sent_at: row.sent_at,
      created_at: row.created_at,
      delivery_status: row.delivery_status,
      contact: firstContact(conv?.contacts)
    };
  });

  const classifications = ((classificationsRes.data ?? []) as ClassificationRow[]).map((row) => {
    const conv = pickConversation(row.conversations);
    return {
      id: row.id,
      message_id: row.message_id,
      conversation_id: row.conversation_id,
      contact_id: row.contact_id,
      intent: row.intent,
      confidence: row.confidence,
      urgency: row.urgency,
      summary: row.summary,
      recommended_action: row.recommended_action,
      model: row.model,
      created_at: row.created_at,
      contact: firstContact(conv?.contacts)
    };
  });

  return { messages, classifications };
}
