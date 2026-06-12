// Shared constants + types for operator action enums. Kept in a NON-"use server" file
// so client components can import them safely -- only function exports from a "use server"
// module are valid; constants end up undefined on the client.

export const CONVERSATION_STATUS = [
  "open",
  "waiting_on_customer",
  "waiting_on_human",
  "closed",
  "spam"
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUS)[number];

export const CONVERSATION_PRIORITY = ["low", "normal", "high", "urgent"] as const;
export type ConversationPriority = (typeof CONVERSATION_PRIORITY)[number];

export const HANDOFF_STATUS = ["open", "assigned", "resolved", "cancelled"] as const;
export type HandoffStatus = (typeof HANDOFF_STATUS)[number];

export const LEAD_EVENT_STATUS = [
  "new",
  "qualified",
  "follow_up",
  "won",
  "lost",
  "spam"
] as const;
export type LeadEventStatus = (typeof LEAD_EVENT_STATUS)[number];

export type ActionResult = { ok: true } | { ok: false; message: string };
