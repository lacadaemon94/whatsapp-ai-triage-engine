import "server-only";

import type {
  Classification,
  Contact,
  Conversation,
  ConversationView,
  DashboardStats,
  HandoffRequest,
  LeadEvent,
  Message
} from "@/lib/data/types";
import type { ActivityFeed } from "@/lib/data/activity";
import type { HandoffWithContext } from "@/lib/data/handoffs";
import type { LeadEventWithContext } from "@/lib/data/leads";
import type { ConversationDetail } from "@/lib/data/conversation-detail";

import {
  CLASSIFICATIONS,
  CONTACTS,
  CONVERSATIONS,
  HANDOFFS,
  LEAD_EVENTS,
  MESSAGES
} from "./fixtures";

// In-memory store. Singleton at module scope so that within a single Next.js
// server process all read + write paths share the same state. Survives router
// refreshes, lost on process restart -- which is exactly what we want for a
// demo: every cold boot starts clean.

type StoreState = {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  classifications: Classification[];
  handoffs: HandoffRequest[];
  leadEvents: LeadEvent[];
  // Auto-incrementing counter for synthesized IDs.
  seq: number;
};

// Globals on globalThis so Next.js dev HMR doesn't reset on every file change.
declare global {
  // eslint-disable-next-line no-var
  var __TRIAGE_DEMO_STORE__: StoreState | undefined;
}

function freshState(): StoreState {
  // Deep clone the fixtures so mutations don't pollute the module-level
  // arrays exported from ./fixtures.ts.
  return {
    contacts: CONTACTS.map((c) => ({ ...c })),
    conversations: CONVERSATIONS.map((c) => ({ ...c })),
    messages: MESSAGES.map((m) => ({ ...m })),
    classifications: CLASSIFICATIONS.map((c) => ({ ...c })),
    handoffs: HANDOFFS.map((h) => ({ ...h })),
    leadEvents: LEAD_EVENTS.map((l) => ({ ...l })),
    seq: 100_000
  };
}

function state(): StoreState {
  if (!globalThis.__TRIAGE_DEMO_STORE__) {
    globalThis.__TRIAGE_DEMO_STORE__ = freshState();
  }
  return globalThis.__TRIAGE_DEMO_STORE__;
}

function nextId(prefix: string): string {
  const s = state();
  s.seq += 1;
  return `${prefix}-${s.seq}`;
}

// --- Reads (shape-compatible with src/lib/data/*) ---------------------------

export function demoGetStats(): DashboardStats {
  const s = state();
  return {
    totalConversations: s.conversations.length,
    openConversations: s.conversations.filter((c) =>
      ["open", "waiting_on_customer", "waiting_on_ai"].includes(c.status ?? "")
    ).length,
    waitingOnHuman: s.conversations.filter((c) => c.status === "waiting_on_human").length,
    highPriority: s.conversations.filter((c) => c.priority === "high").length,
    newLeadEvents: s.leadEvents.filter((l) => l.status === "new").length,
    outboundTracked: s.messages.filter(
      (m) => m.direction === "outbound" && m.delivery_status !== null
    ).length
  };
}

function contactById(contactId: string): Contact | null {
  return state().contacts.find((c) => c.id === contactId) ?? null;
}

export function demoGetConversationList(limit = 60): ConversationView[] {
  const s = state();
  return [...s.conversations]
    .sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""))
    .slice(0, limit)
    .map((conv) => ({
      ...conv,
      contact: contactById(conv.contact_id),
      latestMessage: null,
      messages: [],
      latestClassification: null,
      handoffs: [],
      leadEvents: []
    }));
}

export function demoGetConversationDetail(
  conversationId: string
): ConversationDetail | null {
  const s = state();
  const conversation = s.conversations.find((c) => c.id === conversationId);
  if (!conversation) return null;

  const messages = s.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => (a.sent_at ?? "").localeCompare(b.sent_at ?? ""));

  const classifications = s.classifications
    .filter((c) => c.conversation_id === conversationId)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const handoffs = s.handoffs
    .filter((h) => h.conversation_id === conversationId)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const leadEvents = s.leadEvents
    .filter((l) => l.conversation_id === conversationId)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return {
    conversation,
    contact: contactById(conversation.contact_id),
    messages,
    latestClassification: classifications[0] ?? null,
    classifications,
    handoffs,
    leadEvents
  };
}

export function demoGetHandoffsWithContext(limit = 80): HandoffWithContext[] {
  const s = state();
  return [...s.handoffs]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, limit)
    .map((h) => ({ ...h, contact: contactById(h.contact_id) }));
}

export function demoGetLeadEventsWithContext(limit = 80): LeadEventWithContext[] {
  const s = state();
  return [...s.leadEvents]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, limit)
    .map((l) => ({ ...l, contact: contactById(l.contact_id) }));
}

export function demoGetActivityFeed(limit = 120): ActivityFeed {
  const s = state();
  const perSide = Math.max(Math.ceil(limit / 1.5), 40);

  const messages = [...s.messages]
    .sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""))
    .slice(0, perSide)
    .map((m) => ({ ...m, contact: contactById(m.contact_id) }));

  const classifications = [...s.classifications]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, perSide)
    .map((c) => ({ ...c, contact: contactById(c.contact_id) }));

  return { messages, classifications };
}

// --- Mutations (used by demo server actions + simulator) --------------------

export function demoUpdateConversation(
  conversationId: string,
  patch: Partial<Pick<Conversation, "status" | "priority" | "summary" | "last_intent" | "last_message_at">>
): boolean {
  const s = state();
  const conv = s.conversations.find((c) => c.id === conversationId);
  if (!conv) return false;
  Object.assign(conv, patch, { updated_at: new Date().toISOString() });
  return true;
}

export function demoAppendOutboundMessage(
  conversationId: string,
  body: string,
  senderType: "ai" | "human" = "human"
): Message | null {
  const s = state();
  const conv = s.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;
  const now = new Date().toISOString();
  const msg: Message = {
    id: nextId("ms"),
    conversation_id: conv.id,
    contact_id: conv.contact_id,
    direction: "outbound",
    sender_type: senderType,
    body,
    sent_at: now,
    created_at: now,
    delivery_status: "delivered"
  };
  s.messages.push(msg);
  conv.last_message_at = now;
  conv.updated_at = now;
  // Operator typed a reply → conversation moves out of "waiting_on_human"
  if (senderType === "human" && conv.status === "waiting_on_human") {
    conv.status = "waiting_on_customer";
  }
  return msg;
}

export function demoAppendInboundMessage(
  conversationId: string,
  body: string,
  classification?: Omit<Classification, "id" | "conversation_id" | "contact_id" | "message_id" | "created_at" | "model">
): { message: Message; classification: Classification | null } | null {
  const s = state();
  const conv = s.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;
  const now = new Date().toISOString();
  const message: Message = {
    id: nextId("ms"),
    conversation_id: conv.id,
    contact_id: conv.contact_id,
    direction: "inbound",
    sender_type: "customer",
    body,
    sent_at: now,
    created_at: now,
    delivery_status: null
  };
  s.messages.push(message);
  conv.last_message_at = now;
  conv.updated_at = now;
  if (conv.status === "closed") conv.status = "open";

  let cls: Classification | null = null;
  if (classification) {
    cls = {
      id: nextId("ai"),
      message_id: message.id,
      conversation_id: conv.id,
      contact_id: conv.contact_id,
      created_at: now,
      model: "gpt-4.1-mini",
      ...classification
    };
    s.classifications.push(cls);
    conv.last_intent = cls.intent;
    if (cls.summary) conv.summary = cls.summary;

    // Update contact denorm fields
    const contact = contactById(conv.contact_id);
    if (contact) {
      contact.last_intent = cls.intent;
      contact.last_seen_at = now;
      if (cls.summary) contact.conversation_summary = cls.summary;
    }
  }

  return { message, classification: cls };
}

export function demoUpdateHandoff(
  handoffId: string,
  patch: Partial<Pick<HandoffRequest, "status" | "resolved_at">>
): { conversation_id: string } | null {
  const s = state();
  const h = s.handoffs.find((x) => x.id === handoffId);
  if (!h) return null;
  Object.assign(h, patch);
  return { conversation_id: h.conversation_id };
}

export function demoUpdateLeadEvent(
  leadEventId: string,
  patch: Partial<Pick<LeadEvent, "status">>
): { conversation_id: string } | null {
  const s = state();
  const l = s.leadEvents.find((x) => x.id === leadEventId);
  if (!l) return null;
  Object.assign(l, patch);
  return { conversation_id: l.conversation_id };
}

// Cheap snapshot used by the realtime simulator + the /api/demo/tick endpoint
// to gauge "did anything change since last poll".
export function demoSnapshotVersion(): { messages: number; classifications: number } {
  const s = state();
  return {
    messages: s.messages.length,
    classifications: s.classifications.length
  };
}

// Exposed for the simulator -- read a random open conversation.
export function demoRandomOpenConversation(): Conversation | null {
  const s = state();
  const open = s.conversations.filter((c) => c.status !== "closed");
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}
