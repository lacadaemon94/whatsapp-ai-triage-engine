import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetConversationDetail } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type {
  Classification,
  Contact,
  Conversation,
  HandoffRequest,
  LeadEvent,
  Message
} from "./types";

const CONVERSATION_COLUMNS =
  "id, contact_id, status, priority, last_message_at, last_intent, summary, external_thread_id, business_phone_number, created_at, updated_at";

const CONTACT_COLUMNS =
  "id, phone_number, display_name, lead_score, open_status, last_seen_at, last_intent, conversation_summary";

type ConversationRow = Conversation & { contacts: Contact | Contact[] | null };

function firstContact(value: ConversationRow["contacts"]): Contact | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type ConversationDetail = {
  conversation: Conversation;
  contact: Contact | null;
  messages: Message[];
  latestClassification: Classification | null;
  classifications: Classification[];
  handoffs: HandoffRequest[];
  leadEvents: LeadEvent[];
};

// Full payload for the /inbox/[id] detail page. All five secondary queries are
// scoped by conversation_id and explicitly limited, so the page cost is bounded
// regardless of historical volume.
export async function getConversationDetail(
  conversationId: string
): Promise<ConversationDetail | null> {
  if (isDemoMode()) return demoGetConversationDetail(conversationId);

  const supabase = await getSupabaseServerClient();

  const conversationPromise = supabase
    .from("conversations")
    .select(`${CONVERSATION_COLUMNS}, contacts:contacts(${CONTACT_COLUMNS})`)
    .eq("id", conversationId)
    .maybeSingle();

  const messagesPromise = supabase
    .from("messages")
    .select(
      "id, conversation_id, contact_id, direction, sender_type, body, sent_at, created_at, delivery_status"
    )
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true })
    .limit(500);

  const classificationsPromise = supabase
    .from("ai_classifications")
    .select(
      "id, message_id, conversation_id, contact_id, intent, confidence, urgency, summary, recommended_action, model, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(40);

  const handoffsPromise = supabase
    .from("handoff_requests")
    .select(
      "id, contact_id, conversation_id, message_id, status, reason, priority, requested_by, created_at, resolved_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(40);

  const leadEventsPromise = supabase
    .from("lead_events")
    .select(
      "id, contact_id, conversation_id, message_id, event_type, status, score_delta, notes, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(40);

  const [conversationRes, messagesRes, classificationsRes, handoffsRes, leadEventsRes] =
    await Promise.all([
      conversationPromise,
      messagesPromise,
      classificationsPromise,
      handoffsPromise,
      leadEventsPromise
    ]);

  if (conversationRes.error) {
    throw new Error(`Could not load conversation: ${conversationRes.error.message}`);
  }
  if (!conversationRes.data) return null;

  if (messagesRes.error) throw new Error(`Could not load messages: ${messagesRes.error.message}`);
  if (classificationsRes.error)
    throw new Error(`Could not load ai_classifications: ${classificationsRes.error.message}`);
  if (handoffsRes.error)
    throw new Error(`Could not load handoff_requests: ${handoffsRes.error.message}`);
  if (leadEventsRes.error)
    throw new Error(`Could not load lead_events: ${leadEventsRes.error.message}`);

  const conversationRow = conversationRes.data as ConversationRow;
  const classifications = (classificationsRes.data ?? []) as Classification[];

  return {
    conversation: conversationRow,
    contact: firstContact(conversationRow.contacts),
    messages: (messagesRes.data ?? []) as Message[],
    latestClassification: classifications[0] ?? null,
    classifications,
    handoffs: (handoffsRes.data ?? []) as HandoffRequest[],
    leadEvents: (leadEventsRes.data ?? []) as LeadEvent[]
  };
}
