import { getDashboardStats } from "@/lib/data/stats";
import { getActivityFeed } from "@/lib/data/activity";
import { StatsRow } from "@/components/dashboard/stats";
import { RecordList, type RecordItem } from "@/components/dashboard/record-list";
import { intentMeta, statusTone, confidencePercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const [stats, feed] = await Promise.all([getDashboardStats(), getActivityFeed(120)]);

  const items: RecordItem[] = [
    ...feed.messages.map<RecordItem>((m) => {
      const isOutbound = m.direction === "outbound";
      return {
        id: `m-${m.id}`,
        href: `/inbox/${m.conversation_id}`,
        title: isOutbound ? "Outbound message" : "Inbound message",
        subtitle: m.body || "—",
        contactName: m.contact?.display_name,
        contactPhone: m.contact?.phone_number,
        badge: {
          label: isOutbound ? m.delivery_status ?? "sent" : "received",
          tone: isOutbound ? statusTone(m.delivery_status) : "secondary"
        },
        at: m.sent_at ?? m.created_at
      };
    }),
    ...feed.classifications.map<RecordItem>((c) => {
      const intent = intentMeta(c.intent);
      return {
        id: `c-${c.id}`,
        href: `/inbox/${c.conversation_id}`,
        title: `AI · ${intent.label}`,
        subtitle: c.summary ?? `${intent.label} at ${confidencePercent(c.confidence) ?? "?"}% confidence`,
        contactName: c.contact?.display_name,
        contactPhone: c.contact?.phone_number,
        badge: { label: c.urgency ?? "medium", tone: statusTone(c.urgency) },
        metaLeft: c.model ? { label: c.model, mono: true } : undefined,
        at: c.created_at
      };
    })
  ]
    .sort((a, b) => Date.parse(b.at ?? "") - Date.parse(a.at ?? ""))
    .slice(0, 120);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <StatsRow stats={stats} />
      <div className="min-h-0 flex-1">
        <RecordList
          eyebrow="System stream"
          title="Activity"
          items={items}
          emptyCopy="No activity yet."
          countSuffix="events"
        />
      </div>
    </div>
  );
}
