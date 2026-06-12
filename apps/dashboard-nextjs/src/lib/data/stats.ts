import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { demoGetStats } from "@/lib/demo/store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { DashboardStats } from "./types";

// Single round trip of 6 HEAD count queries. Each runs `select count(*) where ...`
// at Postgres with no row payload, so this stays roughly constant regardless of
// table size. RLS keeps non-operators out.
export async function getDashboardStats(): Promise<DashboardStats> {
  if (isDemoMode()) return demoGetStats();

  const supabase = await getSupabaseServerClient();

  const [
    totalRes,
    openRes,
    humanRes,
    highRes,
    leadsRes,
    outboundRes
  ] = await Promise.all([
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "waiting_on_customer", "waiting_on_ai"]),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting_on_human"),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("priority", "high"),
    supabase
      .from("lead_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "outbound")
      .not("delivery_status", "is", null)
  ]);

  function pick(name: string, res: { count: number | null; error: { message: string } | null }): number {
    if (res.error) throw new Error(`Stats query ${name} failed: ${res.error.message}`);
    return res.count ?? 0;
  }

  return {
    totalConversations: pick("totalConversations", totalRes),
    openConversations: pick("openConversations", openRes),
    waitingOnHuman: pick("waitingOnHuman", humanRes),
    highPriority: pick("highPriority", highRes),
    newLeadEvents: pick("newLeadEvents", leadsRes),
    outboundTracked: pick("outboundTracked", outboundRes)
  };
}
