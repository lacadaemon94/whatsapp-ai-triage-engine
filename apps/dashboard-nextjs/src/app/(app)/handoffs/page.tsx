import { getDashboardStats } from "@/lib/data/stats";
import { getHandoffsWithContext } from "@/lib/data/handoffs";
import { StatsRow } from "@/components/dashboard/stats";
import { RecordList, type RecordItem, statusTone } from "@/components/dashboard/record-list";
import { HandoffResolveButton } from "@/components/dashboard/handoff-row-actions";

export const dynamic = "force-dynamic";

export default async function HandoffsPage() {
  const [stats, handoffs] = await Promise.all([getDashboardStats(), getHandoffsWithContext()]);

  const items: RecordItem[] = handoffs.map((h) => ({
    id: h.id,
    href: `/inbox/${h.conversation_id}`,
    title: h.reason ?? "Human review requested",
    subtitle: h.reason ?? "Human review requested",
    contactName: h.contact?.display_name,
    contactPhone: h.contact?.phone_number,
    badge: { label: h.priority ?? "normal", tone: statusTone(h.priority) },
    metaLeft: h.status ? { label: h.status.replaceAll("_", " ") } : undefined,
    at: h.created_at,
    actions: <HandoffResolveButton handoffId={h.id} currentStatus={h.status} />
  }));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <StatsRow stats={stats} />
      <div className="min-h-0 flex-1">
        <RecordList
          eyebrow="Human queue"
          title="Handoffs"
          items={items}
          emptyCopy="No handoff requests yet."
        />
      </div>
    </div>
  );
}
