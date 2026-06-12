// Shared row shapes for triage data. Kept in their own module so server + components
// can reference them without dragging in a Supabase client.

export type Contact = {
  id: string;
  phone_number: string;
  display_name: string | null;
  lead_score: number | null;
  open_status: string | null;
  last_seen_at: string | null;
  last_intent: string | null;
  conversation_summary: string | null;
};

export type Conversation = {
  id: string;
  contact_id: string;
  status: string | null;
  priority: string | null;
  last_message_at: string | null;
  last_intent: string | null;
  summary: string | null;
  external_thread_id: string | null;
  business_phone_number: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  contact_id: string;
  direction: "inbound" | "outbound" | string;
  sender_type: string | null;
  body: string | null;
  sent_at: string | null;
  created_at: string | null;
  delivery_status: string | null;
};

export type Classification = {
  id: string;
  message_id: string | null;
  conversation_id: string;
  contact_id: string;
  intent: string;
  confidence: number | null;
  urgency: string | null;
  summary: string | null;
  recommended_action: string | null;
  model: string | null;
  created_at: string | null;
};

export type HandoffRequest = {
  id: string;
  contact_id: string;
  conversation_id: string;
  message_id: string | null;
  status: string | null;
  reason: string | null;
  priority: string | null;
  requested_by: string | null;
  created_at: string | null;
  resolved_at: string | null;
};

export type LeadEvent = {
  id: string;
  contact_id: string;
  conversation_id: string;
  message_id: string | null;
  event_type: string;
  status: string | null;
  score_delta: number | null;
  notes: string | null;
  created_at: string | null;
};

// Conversation enriched with contact and the few derived fields the UI components
// expect. `messages`/`latestMessage`/`latestClassification` etc are kept here so list
// + detail views share one type, but list fetches can leave them empty -- the UI
// already falls back to denormalized columns (last_intent, summary, last_message_at).
export type ConversationView = Conversation & {
  contact: Contact | null;
  latestMessage: Message | null;
  messages: Message[];
  latestClassification: Classification | null;
  handoffs: HandoffRequest[];
  leadEvents: LeadEvent[];
};

export type DashboardStats = {
  totalConversations: number;
  openConversations: number;
  waitingOnHuman: number;
  highPriority: number;
  newLeadEvents: number;
  outboundTracked: number;
};
