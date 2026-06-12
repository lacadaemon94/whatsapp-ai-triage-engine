import {
  Sparkles,
  HelpCircle,
  CalendarCheck,
  UserCog,
  ShieldAlert,
  HelpingHand,
  type IconComponent
} from "@/components/ui/icon";

export type ToneVariant = "default" | "success" | "warning" | "destructive" | "info" | "muted" | "secondary";

export const INTENT_META: Record<
  string,
  { label: string; icon: IconComponent; tone: ToneVariant }
> = {
  sales_lead: { label: "Sales lead", icon: Sparkles, tone: "info" },
  support_faq: { label: "Support FAQ", icon: HelpCircle, tone: "secondary" },
  reservation_booking: { label: "Reservation", icon: CalendarCheck, tone: "default" },
  human_escalation: { label: "Human escalation", icon: UserCog, tone: "warning" },
  spam_noise: { label: "Spam / noise", tone: "muted", icon: ShieldAlert },
  unknown: { label: "Unclassified", tone: "muted", icon: HelpingHand }
};

export function intentMeta(intent: string | null | undefined) {
  if (!intent) return INTENT_META.unknown;
  return INTENT_META[intent] ?? { label: intent.replaceAll("_", " "), icon: HelpingHand, tone: "secondary" };
}

export function statusTone(value: string | null | undefined): ToneVariant {
  switch (value) {
    case "waiting_on_human":
    case "high":
    case "failed":
    case "undelivered":
      return "destructive";
    case "delivered":
    case "waiting_on_customer":
    case "resolved":
      return "success";
    case "waiting_on_ai":
    case "medium":
    case "queued":
    case "sent":
      return "info";
    case "spam":
    case "closed":
      return "muted";
    case "low":
      return "secondary";
    default:
      return "secondary";
  }
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d);
}

export function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return "Today";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(d);
}

export function dayKey(value: string | null | undefined) {
  if (!value) return "unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function initials(name?: string | null, phone?: string | null) {
  const src = (name || phone || "").trim();
  if (!src) return "—";
  if (src.startsWith("whatsapp:")) return src.replace("whatsapp:", "").slice(-2);
  if (src.startsWith("+") || /^\d/.test(src)) return src.replace(/\D/g, "").slice(-2);
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

export function displayName(name?: string | null, phone?: string | null) {
  return name?.trim() || phone?.replace("whatsapp:", "") || "Unknown contact";
}

export function confidencePercent(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return Math.round(value * 100);
}
