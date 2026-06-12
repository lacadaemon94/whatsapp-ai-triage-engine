import "server-only";

import { demoAppendInboundMessage, demoRandomOpenConversation } from "./store";

// Canned "next-message" pool by intent. The simulator picks a random open
// conversation, then a random follow-up consistent with the existing intent so
// the demo feels coherent rather than random noise.

const FOLLOWUPS: Record<string, Array<{ body: string; intent: string; confidence: number; urgency: string; summary: string; action: string }>> = {
  sales_lead: [
    {
      body: "Also — what's your alcohol service like? We'd want a small bar.",
      intent: "sales_lead",
      confidence: 0.86,
      urgency: "medium",
      summary: "Follow-up about bar / alcohol service.",
      action: "Send bar package options"
    },
    {
      body: "And one more thing — can you accommodate dietary restrictions?",
      intent: "sales_lead",
      confidence: 0.88,
      urgency: "medium",
      summary: "Asking about dietary accommodation.",
      action: "Send dietary policy"
    }
  ],
  reservation_booking: [
    {
      body: "Sorry, can we push it back 30 minutes? Stuck in traffic.",
      intent: "reservation_booking",
      confidence: 0.93,
      urgency: "medium",
      summary: "Requesting reservation time shift +30 minutes.",
      action: "Adjust reservation + confirm"
    },
    {
      body: "One more person joining, can you make it +1?",
      intent: "reservation_booking",
      confidence: 0.91,
      urgency: "medium",
      summary: "Reservation party size increase by 1.",
      action: "Verify capacity + confirm"
    }
  ],
  support_faq: [
    {
      body: "Also, what time do you close on weekends?",
      intent: "support_faq",
      confidence: 0.94,
      urgency: "low",
      summary: "Asking about weekend hours.",
      action: "Answer + send hours card"
    },
    {
      body: "Do you have gluten-free options on the brunch menu?",
      intent: "support_faq",
      confidence: 0.92,
      urgency: "low",
      summary: "Gluten-free menu question.",
      action: "Answer + flag dietary tag"
    }
  ],
  human_escalation: [
    {
      body: "Is there a phone number I can call directly?",
      intent: "human_escalation",
      confidence: 0.95,
      urgency: "high",
      summary: "Wants a phone callback.",
      action: "Provide direct line + bump priority"
    }
  ],
  unknown: [
    {
      body: "Sorry, never mind.",
      intent: "unknown",
      confidence: 0.42,
      urgency: "low",
      summary: "Customer abandoning the thread.",
      action: "Close if no follow-up within 24h"
    }
  ]
};

// Pick a follow-up consistent with the conversation's existing intent. Falls
// back to a generic 'thanks' for unknown intents.
function pickFollowup(conversationIntent: string | null) {
  const bucket = FOLLOWUPS[conversationIntent ?? ""] ?? FOLLOWUPS.unknown;
  return bucket[Math.floor(Math.random() * bucket.length)];
}

// Runs ONE simulated tick: picks a random open conversation, appends a new
// inbound message + classification. The realtime refresher polls this on a
// timer.
export function runSimulatorTick(): { conversationId: string; messageId: string } | null {
  const conv = demoRandomOpenConversation();
  if (!conv) return null;
  const followup = pickFollowup(conv.last_intent);
  const result = demoAppendInboundMessage(conv.id, followup.body, {
    intent: followup.intent,
    confidence: followup.confidence,
    urgency: followup.urgency,
    summary: followup.summary,
    recommended_action: followup.action
  });
  if (!result) return null;
  return { conversationId: conv.id, messageId: result.message.id };
}
