import { getDashboardStats } from "@/lib/data/stats";
import { getLeadEventsWithContext } from "@/lib/data/leads";
import { StatsRow } from "@/components/dashboard/stats";
import { RecordList, type RecordItem } from "@/components/dashboard/record-list";
import { LeadEventStatusSelect } from "@/components/dashboard/lead-event-row-actions";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [stats, leadEvents] = await Promise.all([getDashboardStats(), getLeadEventsWithContext()]);

  const items: RecordItem[] = leadEvents.map((e) => {
    const delta = e.score_delta ?? 0;
    return {
      id: e.id,
      href: `/inbox/${e.conversation_id}`,
      title: e.event_type.replaceAll("_", " "),
      subtitle: e.notes ?? `Lead event · ${e.event_type.replaceAll("_", " ")}`,
      contactName: e.contact?.display_name,
      contactPhone: e.contact?.phone_number,
      badge: {
        label: `${delta > 0 ? "+" : ""}${delta} pts`,
        tone: delta > 0 ? "success" : delta < 0 ? "destructive" : "muted"
      },
      metaLeft: undefined,
      at: e.created_at,
      actions: <LeadEventStatusSelect leadEventId={e.id} current={e.status} />
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <StatsRow stats={stats} />
      <div className="min-h-0 flex-1">
        <RecordList
          eyebrow="Lead pipeline"
          title="Lead events"
          items={items}
          emptyCopy="No lead events recorded yet."
        />
      </div>
    </div>
  );
}
