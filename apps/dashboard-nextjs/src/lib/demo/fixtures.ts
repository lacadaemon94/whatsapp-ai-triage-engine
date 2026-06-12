import type {
  Classification,
  Contact,
  Conversation,
  HandoffRequest,
  LeadEvent,
  Message
} from "@/lib/data/types";

// Demo fixture set. Backstory: a fictional small business called
// "Northcrest Café & Events" — a coffee shop that also hosts private events.
// Conversations cover the full intent surface:
//   - sales_lead, reservation_booking, support_faq, human_escalation,
//     unknown, spam_noise.
// All names + phone numbers are fake (E.164 555 reserved-for-fiction prefix).

export const DEMO_BUSINESS_NUMBER = "+15550199900";

// Timeline anchor — fixtures use relative offsets so the data "feels" fresh
// whenever the demo boots. Initialized once at module load.
const NOW = Date.now();
function ago(min: number): string {
  return new Date(NOW - min * 60_000).toISOString();
}
function id(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

// --- Contacts ----------------------------------------------------------------

export const CONTACTS: Contact[] = [
  {
    id: id("ct", 1),
    phone_number: "+15550100001",
    display_name: "Sarah Chen",
    lead_score: 78,
    open_status: "open",
    last_seen_at: ago(3),
    last_intent: "sales_lead",
    conversation_summary:
      "Asking about pricing and availability for a 30-person company offsite next month."
  },
  {
    id: id("ct", 2),
    phone_number: "+15550100002",
    display_name: "Marcus Rivera",
    lead_score: 42,
    open_status: "open",
    last_seen_at: ago(12),
    last_intent: "reservation_booking",
    conversation_summary: "Wants a table for 6 this Saturday at 8pm. Awaiting confirmation."
  },
  {
    id: id("ct", 3),
    phone_number: "+15550100003",
    display_name: "Priya Patel",
    lead_score: 15,
    open_status: "open",
    last_seen_at: ago(28),
    last_intent: "support_faq",
    conversation_summary: "Asked whether the café is dog-friendly on the patio."
  },
  {
    id: id("ct", 4),
    phone_number: "+15550100004",
    display_name: "Daniel Okafor",
    lead_score: 91,
    open_status: "open",
    last_seen_at: ago(42),
    last_intent: "human_escalation",
    conversation_summary:
      "Frustrated about a charge on his card from last week's catering order. Wants a manager."
  },
  {
    id: id("ct", 5),
    phone_number: "+15550100005",
    display_name: "Lena Hartwig",
    lead_score: 88,
    open_status: "open",
    last_seen_at: ago(56),
    last_intent: "sales_lead",
    conversation_summary: "Considering Northcrest for a 60-person wedding rehearsal dinner."
  },
  {
    id: id("ct", 6),
    phone_number: "+15550100006",
    display_name: "Tom Whitaker",
    lead_score: 5,
    open_status: "closed",
    last_seen_at: ago(74),
    last_intent: "spam_noise",
    conversation_summary: "Bot promoting a forex telegram channel. Ignored."
  },
  {
    id: id("ct", 7),
    phone_number: "+15550100007",
    display_name: "Aisha Bello",
    lead_score: 63,
    open_status: "open",
    last_seen_at: ago(95),
    last_intent: "reservation_booking",
    conversation_summary: "Booked a 4-person reservation for Sunday brunch at 11am."
  },
  {
    id: id("ct", 8),
    phone_number: "+15550100008",
    display_name: "Hiroshi Nakamura",
    lead_score: 34,
    open_status: "open",
    last_seen_at: ago(120),
    last_intent: "support_faq",
    conversation_summary: "Asking whether you accept Apple Pay."
  },
  {
    id: id("ct", 9),
    phone_number: "+15550100009",
    display_name: "Riley Thompson",
    lead_score: 70,
    open_status: "open",
    last_seen_at: ago(148),
    last_intent: "sales_lead",
    conversation_summary: "Repeat customer asking about a monthly coffee subscription."
  },
  {
    id: id("ct", 10),
    phone_number: "+15550100010",
    display_name: "Mei-Ling Zhou",
    lead_score: 22,
    open_status: "open",
    last_seen_at: ago(180),
    last_intent: "unknown",
    conversation_summary: "Sent a single 'hey'. Awaiting more detail."
  },
  {
    id: id("ct", 11),
    phone_number: "+15550100011",
    display_name: "Anonymous",
    lead_score: 0,
    open_status: "closed",
    last_seen_at: ago(220),
    last_intent: "spam_noise",
    conversation_summary: "Crypto scam template. Filtered."
  },
  {
    id: id("ct", 12),
    phone_number: "+15550100012",
    display_name: "Oliver Schmidt",
    lead_score: 80,
    open_status: "open",
    last_seen_at: ago(265),
    last_intent: "reservation_booking",
    conversation_summary: "Booked a 2-person date night for Friday 7:30pm."
  },
  {
    id: id("ct", 13),
    phone_number: "+15550100013",
    display_name: "Carmen Diaz",
    lead_score: 55,
    open_status: "open",
    last_seen_at: ago(310),
    last_intent: "human_escalation",
    conversation_summary: "Allergic reaction concern from yesterday's pastry. Needs a human."
  },
  {
    id: id("ct", 14),
    phone_number: "+15550100014",
    display_name: "Noah Walsh",
    lead_score: 60,
    open_status: "open",
    last_seen_at: ago(360),
    last_intent: "support_faq",
    conversation_summary: "Asked whether there's free WiFi and outlets for laptop work."
  },
  {
    id: id("ct", 15),
    phone_number: "+15550100015",
    display_name: "Yara Haddad",
    lead_score: 85,
    open_status: "open",
    last_seen_at: ago(420),
    last_intent: "sales_lead",
    conversation_summary: "Corporate gifting — 50 holiday hampers needed by mid-December."
  },
  {
    id: id("ct", 16),
    phone_number: "+15550100016",
    display_name: "Jordan Park",
    lead_score: 38,
    open_status: "open",
    last_seen_at: ago(480),
    last_intent: "reservation_booking",
    conversation_summary: "Trying to change an existing reservation from 6 to 8 people."
  },
  {
    id: id("ct", 17),
    phone_number: "+15550100017",
    display_name: "Elena Petrova",
    lead_score: 25,
    open_status: "open",
    last_seen_at: ago(540),
    last_intent: "unknown",
    conversation_summary: "Asked something in a language the classifier didn't recognize."
  },
  {
    id: id("ct", 18),
    phone_number: "+15550100018",
    display_name: "Kwame Asante",
    lead_score: 72,
    open_status: "open",
    last_seen_at: ago(620),
    last_intent: "sales_lead",
    conversation_summary: "Interested in renting the back room for a 25-person book club launch."
  }
];

// --- Conversations -----------------------------------------------------------

function conv(
  n: number,
  contactId: string,
  status: string,
  priority: string,
  minutesAgo: number,
  lastIntent: string,
  summary: string
): Conversation {
  return {
    id: id("cv", n),
    contact_id: contactId,
    status,
    priority,
    last_message_at: ago(minutesAgo),
    last_intent: lastIntent,
    summary,
    external_thread_id: `whatsapp:${CONTACTS[n - 1]?.phone_number ?? "unknown"}::${DEMO_BUSINESS_NUMBER}`,
    business_phone_number: DEMO_BUSINESS_NUMBER,
    created_at: ago(minutesAgo + 60),
    updated_at: ago(minutesAgo)
  };
}

export const CONVERSATIONS: Conversation[] = [
  conv(1, "ct-0001", "waiting_on_human", "high", 3, "sales_lead",
    "Asking about pricing and availability for a 30-person company offsite next month."),
  conv(2, "ct-0002", "open", "medium", 12, "reservation_booking",
    "Wants a table for 6 this Saturday at 8pm. Awaiting confirmation."),
  conv(3, "ct-0003", "waiting_on_ai", "low", 28, "support_faq",
    "Asked whether the café is dog-friendly on the patio."),
  conv(4, "ct-0004", "waiting_on_human", "high", 42, "human_escalation",
    "Frustrated about a charge on his card from last week's catering order."),
  conv(5, "ct-0005", "open", "high", 56, "sales_lead",
    "Considering Northcrest for a 60-person wedding rehearsal dinner."),
  conv(6, "ct-0006", "closed", "low", 74, "spam_noise",
    "Bot promoting a forex telegram channel. Ignored."),
  conv(7, "ct-0007", "waiting_on_customer", "medium", 95, "reservation_booking",
    "Booked a 4-person reservation for Sunday brunch at 11am."),
  conv(8, "ct-0008", "waiting_on_ai", "low", 120, "support_faq",
    "Asking whether you accept Apple Pay."),
  conv(9, "ct-0009", "open", "medium", 148, "sales_lead",
    "Repeat customer asking about a monthly coffee subscription."),
  conv(10, "ct-0010", "open", "low", 180, "unknown",
    "Sent a single 'hey'. Awaiting more detail."),
  conv(11, "ct-0011", "closed", "low", 220, "spam_noise",
    "Crypto scam template. Filtered."),
  conv(12, "ct-0012", "waiting_on_customer", "low", 265, "reservation_booking",
    "Booked a 2-person date night for Friday 7:30pm."),
  conv(13, "ct-0013", "waiting_on_human", "high", 310, "human_escalation",
    "Allergic reaction concern from yesterday's pastry. Needs a human."),
  conv(14, "ct-0014", "waiting_on_ai", "low", 360, "support_faq",
    "Asked whether there's free WiFi and outlets for laptop work."),
  conv(15, "ct-0015", "open", "high", 420, "sales_lead",
    "Corporate gifting — 50 holiday hampers needed by mid-December."),
  conv(16, "ct-0016", "open", "medium", 480, "reservation_booking",
    "Trying to change an existing reservation from 6 to 8 people."),
  conv(17, "ct-0017", "open", "low", 540, "unknown",
    "Asked something in a language the classifier didn't recognize."),
  conv(18, "ct-0018", "open", "medium", 620, "sales_lead",
    "Interested in renting the back room for a 25-person book club launch.")
];

// --- Messages ---------------------------------------------------------------
//
// Compact authoring helper -- writing tuples is far easier to scan than 18
// expanded object literals. Each tuple is [conversationIndex, direction,
// senderType, body, minutesAgo].

type MsgSpec = [
  number,
  "inbound" | "outbound",
  "customer" | "ai" | "human",
  string,
  number
];

const MESSAGE_SPECS: MsgSpec[] = [
  // 1 — Sarah Chen / sales lead, 30-person offsite
  [1, "inbound", "customer", "Hi! Quick question — do you host private corporate events?", 95],
  [1, "outbound", "ai", "Yes, we host private events for groups from 10 to 80. Could you share the date, headcount, and the style you're going for (cocktail vs. seated)?", 93],
  [1, "inbound", "customer", "Looking at Oct 23rd, ~30 people, prefer a seated dinner with a couple of breakouts.", 60],
  [1, "outbound", "ai", "Got it. For 30 seated with breakout space, our Garden Room is the best fit. A human will follow up shortly with pricing and a sample menu.", 58],
  [1, "inbound", "customer", "Perfect, thank you!", 3],

  // 2 — Marcus Rivera / reservation
  [2, "inbound", "customer", "Hey, can I book a table for 6 this Saturday at 8pm?", 90],
  [2, "outbound", "ai", "Saturday at 8pm for 6 — I'll check availability and confirm shortly. Any allergies or seating preference?", 88],
  [2, "inbound", "customer", "One vegetarian, no other allergies. Indoor please.", 12],

  // 3 — Priya Patel / dog-friendly?
  [3, "inbound", "customer", "Hi, are dogs allowed on the patio?", 30],
  [3, "outbound", "ai", "Yes — dogs are welcome on our outdoor patio. We even have water bowls on request. The indoor dining area is staff-only for pets.", 28],

  // 4 — Daniel Okafor / billing escalation
  [4, "inbound", "customer", "I'm seeing a $480 charge on my card from last week's catering, but the quoted total was $420.", 60],
  [4, "outbound", "ai", "I understand your concern. I'm flagging this for our manager so they can review the invoice with you directly.", 58],
  [4, "inbound", "customer", "Please, I need this sorted today.", 42],

  // 5 — Lena Hartwig / wedding rehearsal
  [5, "inbound", "customer", "Hello — does Northcrest do rehearsal dinners? We're looking at ~60 guests.", 120],
  [5, "outbound", "ai", "Yes, we host rehearsal dinners up to 80 guests in our Garden Room. Could you share the date and any dietary requirements?", 118],
  [5, "inbound", "customer", "Sat May 18th. Mix of pescatarian and vegan, a couple of gluten-free.", 56],

  // 6 — Tom Whitaker / spam
  [6, "inbound", "customer", "💰 JOIN OUR FOREX SIGNALS — 200% gains weekly. https://t.me/forex-pro-signals", 74],

  // 7 — Aisha Bello / brunch reservation
  [7, "inbound", "customer", "Brunch reservation for 4 this Sunday around 11?", 130],
  [7, "outbound", "ai", "Sunday 11am for 4 — booked! You'll get a confirmation text 24 hours out. Looking forward to seeing you.", 128],
  [7, "inbound", "customer", "Thank you!", 95],

  // 8 — Hiroshi Nakamura / payment FAQ
  [8, "inbound", "customer", "Do you accept Apple Pay?", 125],
  [8, "outbound", "ai", "Yes — we accept Apple Pay, Google Pay, and all major cards (Visa, MC, Amex, Discover).", 120],

  // 9 — Riley Thompson / repeat customer, subscription
  [9, "inbound", "customer", "Hey! Loved the Ethiopia Yirgacheffe last time. Do you do a monthly coffee subscription?", 200],
  [9, "outbound", "ai", "We do! 12oz monthly is $24, 1lb is $38. You can pick a fixed origin or let our roaster surprise you. Want me to set one up?", 198],
  [9, "inbound", "customer", "Yes please, let's do the 1lb, roaster's pick.", 148],

  // 10 — Mei-Ling Zhou / single-word inbound, unknown
  [10, "inbound", "customer", "hey", 180],

  // 11 — Anonymous / crypto spam
  [11, "inbound", "customer", "Congratulations! You have been selected to receive 0.5 BTC. Send your wallet seed to claim.", 220],

  // 12 — Oliver Schmidt / date night
  [12, "inbound", "customer", "Date night, Friday at 7:30, table for 2 — possible?", 280],
  [12, "outbound", "ai", "Friday 7:30 for 2 — booked. Window seat if available?", 278],
  [12, "inbound", "customer", "Yes if you can, otherwise no worries.", 265],

  // 13 — Carmen Diaz / allergic reaction
  [13, "inbound", "customer", "I had a really bad reaction to the almond croissant yesterday — I'm allergic to walnuts. Was there cross-contact?", 320],
  [13, "outbound", "ai", "I'm so sorry — this is serious. I'm bringing in a human right now to review what was in the batch and follow up with you directly.", 318],
  [13, "inbound", "customer", "Thank you, I'm okay but I want to know for next time.", 310],

  // 14 — Noah Walsh / wifi
  [14, "inbound", "customer", "Free wifi? Are there outlets near tables?", 370],
  [14, "outbound", "ai", "Yes — free wifi (password is on the menu) and outlets at most tables. The bar counter has the most reliable outlet access if you're laptop-camping.", 360],

  // 15 — Yara Haddad / 50 hampers
  [15, "inbound", "customer", "Hi! Corporate gifting question — we need 50 holiday hampers delivered by Dec 14. Coffee + pastry boxes. Possible?", 480],
  [15, "outbound", "ai", "Absolutely. For 50 boxes we'd need order confirmation 2 weeks out, so Dec 14 is comfortable. A human will follow up with pricing tiers and contents options.", 478],
  [15, "inbound", "customer", "Great, looking forward to it. Budget is around $25/box.", 420],

  // 16 — Jordan Park / change reservation
  [16, "inbound", "customer", "Hey, I have a reservation Saturday for 6 — can we change it to 8?", 540],
  [16, "outbound", "ai", "Let me check capacity. Could you share the name on the reservation?", 538],
  [16, "inbound", "customer", "Under Park.", 480],

  // 17 — Elena Petrova / unknown language
  [17, "inbound", "customer", "Здравствуйте, у вас есть свободные места на вечер?", 540],

  // 18 — Kwame Asante / back room
  [18, "inbound", "customer", "We're a book club, ~25 people, looking for a private space for a launch evening — drinks + light food. What do you have?", 700],
  [18, "outbound", "ai", "Our back room seats up to 30 and has its own bar. For 25 + drinks + light food, that's the right room. A human will follow up with the room fee, F&B minimum, and a sample menu.", 698],
  [18, "inbound", "customer", "Sounds perfect, awaiting details.", 620]
];

export const MESSAGES: Message[] = MESSAGE_SPECS.map((spec, i) => {
  const [convIdx, direction, sender_type, body, minutesAgo] = spec;
  const conversation = CONVERSATIONS[convIdx - 1];
  return {
    id: id("ms", i + 1),
    conversation_id: conversation.id,
    contact_id: conversation.contact_id,
    direction,
    sender_type,
    body,
    sent_at: ago(minutesAgo),
    created_at: ago(minutesAgo),
    delivery_status: direction === "outbound" ? "delivered" : null
  };
});

// --- AI Classifications ------------------------------------------------------
//
// One classification per inbound message (the realistic shape). The simulator
// will append more as it generates new inbound traffic.

type ClsSpec = [number, string, number, string, string, string];

const CLASSIFICATION_SPECS: ClsSpec[] = [
  [1, "sales_lead", 0.92, "medium", "Inquiry about private corporate event hosting.", "Quote for 30-person seated dinner + breakouts"],
  [2, "reservation_booking", 0.96, "medium", "Reservation for 6, Saturday 8pm, indoor.", "Confirm availability + book"],
  [3, "support_faq", 0.91, "low", "Question about pet policy on the patio.", "Answer + log preference"],
  [4, "human_escalation", 0.98, "high", "Billing discrepancy, requesting manager.", "Escalate to billing team"],
  [5, "sales_lead", 0.94, "high", "Rehearsal dinner inquiry, 60 guests.", "Send Garden Room package + menu"],
  [6, "spam_noise", 0.99, "low", "Forex promotional spam.", "Drop, no reply"],
  [7, "reservation_booking", 0.95, "medium", "Brunch reservation for 4, Sunday 11am.", "Confirm + send reminder"],
  [8, "support_faq", 0.93, "low", "Asks about Apple Pay support.", "Answer immediately"],
  [9, "sales_lead", 0.89, "medium", "Returning customer asking about coffee subscription.", "Walk through subscription options"],
  [10, "unknown", 0.41, "low", "Single 'hey' with no context.", "Ask for more detail"],
  [11, "spam_noise", 0.99, "low", "Crypto scam template.", "Drop, no reply"],
  [12, "reservation_booking", 0.96, "low", "Date-night reservation Friday 7:30 for 2.", "Confirm with window seat preference"],
  [13, "human_escalation", 0.97, "high", "Allergy reaction from a previous order.", "Escalate to manager + food-safety review"],
  [14, "support_faq", 0.90, "low", "WiFi + outlets question.", "Answer + suggest seating"],
  [15, "sales_lead", 0.92, "high", "Corporate gifting, 50 hampers by Dec 14.", "Send pricing tiers + content options"],
  [16, "reservation_booking", 0.88, "medium", "Existing reservation change request.", "Look up + confirm new size"],
  [17, "unknown", 0.55, "low", "Russian text — classifier low confidence.", "Translate + ask for clarification"],
  [18, "sales_lead", 0.93, "medium", "Private back-room rental for book club launch.", "Send room fee + F&B minimum"]
];

export const CLASSIFICATIONS: Classification[] = CLASSIFICATION_SPECS.map((spec, i) => {
  const [convIdx, intent, confidence, urgency, summary, recommended_action] = spec;
  const conversation = CONVERSATIONS[convIdx - 1];
  // Bind classification to the FIRST inbound message of that conversation.
  const firstInbound = MESSAGES.find(
    (m) => m.conversation_id === conversation.id && m.direction === "inbound"
  );
  return {
    id: id("ai", i + 1),
    message_id: firstInbound?.id ?? null,
    conversation_id: conversation.id,
    contact_id: conversation.contact_id,
    intent,
    confidence,
    urgency,
    summary,
    recommended_action,
    model: "gpt-4.1-mini",
    created_at: firstInbound?.sent_at ?? ago(60)
  };
});

// --- Handoff Requests --------------------------------------------------------

export const HANDOFFS: HandoffRequest[] = [
  {
    id: id("ho", 1),
    contact_id: "ct-0001",
    conversation_id: "cv-0001",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0001" && m.direction === "inbound")?.id ?? null,
    status: "open",
    reason: "Corporate offsite quote needs custom menu pricing",
    priority: "high",
    requested_by: "ai",
    created_at: ago(58),
    resolved_at: null
  },
  {
    id: id("ho", 2),
    contact_id: "ct-0004",
    conversation_id: "cv-0004",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0004" && m.direction === "inbound")?.id ?? null,
    status: "open",
    reason: "Billing discrepancy on catering invoice",
    priority: "high",
    requested_by: "ai",
    created_at: ago(58),
    resolved_at: null
  },
  {
    id: id("ho", 3),
    contact_id: "ct-0013",
    conversation_id: "cv-0013",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0013" && m.direction === "inbound")?.id ?? null,
    status: "in_progress",
    reason: "Possible allergen cross-contact — food safety review",
    priority: "high",
    requested_by: "ai",
    created_at: ago(318),
    resolved_at: null
  },
  {
    id: id("ho", 4),
    contact_id: "ct-0005",
    conversation_id: "cv-0005",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0005" && m.direction === "inbound")?.id ?? null,
    status: "resolved",
    reason: "Wedding rehearsal dinner — sent Garden Room package",
    priority: "medium",
    requested_by: "ai",
    created_at: ago(118),
    resolved_at: ago(40)
  }
];

// --- Lead Events -------------------------------------------------------------

export const LEAD_EVENTS: LeadEvent[] = [
  {
    id: id("le", 1),
    contact_id: "ct-0001",
    conversation_id: "cv-0001",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0001" && m.direction === "inbound")?.id ?? null,
    event_type: "qualified_lead",
    status: "new",
    score_delta: 35,
    notes: "Corporate offsite, 30 people, Oct 23 — high-fit",
    created_at: ago(58)
  },
  {
    id: id("le", 2),
    contact_id: "ct-0005",
    conversation_id: "cv-0005",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0005" && m.direction === "inbound")?.id ?? null,
    event_type: "qualified_lead",
    status: "in_progress",
    score_delta: 40,
    notes: "Wedding rehearsal, 60 guests, May 18 — premium booking",
    created_at: ago(118)
  },
  {
    id: id("le", 3),
    contact_id: "ct-0009",
    conversation_id: "cv-0009",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0009" && m.direction === "inbound")?.id ?? null,
    event_type: "subscription_signup",
    status: "new",
    score_delta: 20,
    notes: "Monthly 1lb subscription, roaster's pick",
    created_at: ago(198)
  },
  {
    id: id("le", 4),
    contact_id: "ct-0015",
    conversation_id: "cv-0015",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0015" && m.direction === "inbound")?.id ?? null,
    event_type: "qualified_lead",
    status: "new",
    score_delta: 38,
    notes: "Corporate gifting, 50 hampers, $25/box budget",
    created_at: ago(478)
  },
  {
    id: id("le", 5),
    contact_id: "ct-0018",
    conversation_id: "cv-0018",
    message_id: MESSAGES.find((m) => m.conversation_id === "cv-0018" && m.direction === "inbound")?.id ?? null,
    event_type: "qualified_lead",
    status: "new",
    score_delta: 25,
    notes: "Back-room rental, 25-person book club launch",
    created_at: ago(698)
  }
];
