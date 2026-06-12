// Compatibility shim. The original monolithic getDashboardData() fetcher was
// retired during the data-fetch audit -- pages now import purpose-specific
// helpers from lib/data/* directly. This file re-exports the row shapes so
// existing component imports keep working.

export type {
  Contact,
  Conversation,
  Message,
  Classification,
  HandoffRequest,
  LeadEvent,
  ConversationView,
  DashboardStats
} from "./data/types";
