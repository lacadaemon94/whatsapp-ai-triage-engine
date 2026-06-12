import { getDashboardStats } from "@/lib/data/stats";
import { getConversationListItems } from "@/lib/data/conversations";
import { StatsAligned } from "@/components/dashboard/stats";
import { ConversationList } from "@/components/dashboard/conversation-list";
import { Card } from "@/components/ui/card";
import { Inbox, MessageSquare } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function InboxIndexPage() {
  const [stats, conversations] = await Promise.all([
    getDashboardStats(),
    getConversationListItems()
  ]);
  const hasConversations = conversations.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <StatsAligned stats={stats} />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <ConversationList conversations={conversations} selectedId={null} />
        </Card>
        <Card className="hidden min-h-0 min-w-0 place-items-center lg:grid">
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            {hasConversations ? (
              <>
                <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden />
                <h2 className="text-base font-semibold">Select a conversation</h2>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Pick a thread from the list to see messages, AI classification, and queued work.
                </p>
              </>
            ) : (
              <>
                <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
                <h2 className="text-base font-semibold">No conversations yet</h2>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Once Twilio sends inbound WhatsApp messages through n8n, conversations will appear in the list on the left.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
