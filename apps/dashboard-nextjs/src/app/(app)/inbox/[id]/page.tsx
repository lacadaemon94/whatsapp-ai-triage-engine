import { notFound } from "next/navigation";
import { getDashboardStats } from "@/lib/data/stats";
import { getConversationListItems } from "@/lib/data/conversations";
import { getConversationDetail } from "@/lib/data/conversation-detail";
import { StatsAligned } from "@/components/dashboard/stats";
import { ConversationList } from "@/components/dashboard/conversation-list";
import { ConversationDetail } from "@/components/dashboard/conversation-detail";
import { ClassificationPanel } from "@/components/dashboard/classification-panel";
import { WorkQueue } from "@/components/dashboard/work-queue";
import { RightRail, RightRailSheetTrigger } from "@/components/dashboard/right-rail";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Params) {
  const { id } = await params;

  const [stats, conversations, detail] = await Promise.all([
    getDashboardStats(),
    getConversationListItems(),
    getConversationDetail(id)
  ]);
  if (!detail) notFound();

  // Prefer the freshly-loaded conversation row from the detail call; fall back to
  // the list row so the header still renders if the conversation is older than the
  // list-page cap.
  const listRow = conversations.find((c) => c.id === id);
  const conversation = {
    ...detail.conversation,
    contact: detail.contact,
    latestMessage: null,
    messages: detail.messages,
    latestClassification: detail.latestClassification,
    handoffs: detail.handoffs,
    leadEvents: detail.leadEvents
  };

  // If the conversation wasn't in the list page, splice it in so the left rail still
  // highlights it. (List is sorted newest-first; this is a rare edge case.)
  const listForRail = listRow
    ? conversations
    : [{ ...conversation, latestMessage: null }, ...conversations];

  const rail = (
    <>
      <ClassificationPanel classification={conversation.latestClassification} />
      <WorkQueue handoffs={conversation.handoffs} leadEvents={conversation.leadEvents} />
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <StatsAligned stats={stats} />

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        {/* Conversation list — hidden below lg so the detail can use the full width
            on smaller laptops + tablets. Navigate back via the chevron in the detail header. */}
        <Card className="hidden min-h-0 min-w-0 flex-col overflow-hidden lg:flex">
          <ConversationList conversations={listForRail} selectedId={conversation.id} />
        </Card>

        {/* Detail — flex-col so the inner div stretches to fill the Card's width. */}
        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <ConversationDetail
            conversation={conversation}
            detailsSlot={<RightRailSheetTrigger>{rail}</RightRailSheetTrigger>}
          />
        </Card>

        {/* Right rail — desktop only */}
        <RightRail>{rail}</RightRail>
      </div>
    </div>
  );
}
