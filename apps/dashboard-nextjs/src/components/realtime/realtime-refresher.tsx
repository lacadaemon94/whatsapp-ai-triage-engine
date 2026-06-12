"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, RealtimeChannel, Session } from "@supabase/supabase-js";

import { isClientDemoMode } from "@/lib/demo/mode";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRealtimeStatusSetter } from "./realtime-status-context";

const TRIAGE_TABLES = [
  "conversations",
  "messages",
  "ai_classifications",
  "handoff_requests",
  "lead_events"
] as const;

// Coalesce bursts of events (e.g. a single inbound webhook can write a message,
// then a classification, then a lead_event in quick succession) into ONE router
// refresh.
const REFRESH_DEBOUNCE_MS = 300;

// Demo-mode polling intervals. The tick interval is intentionally slow so the
// activity feels "ambient" rather than spammy.
const DEMO_TICK_MS = 12_000;

export function RealtimeRefresher() {
  const router = useRouter();
  const setStatus = useRealtimeStatusSetter();

  React.useEffect(() => {
    // DEMO MODE: no Supabase websocket; instead, periodically POST to the
    // /api/demo/tick endpoint to grow the in-memory store, then call
    // router.refresh() so the new fixture flows through the server components.
    if (isClientDemoMode()) {
      let cancelled = false;
      setStatus("live");

      const id = setInterval(async () => {
        if (cancelled) return;
        try {
          const res = await fetch("/api/demo/tick", { method: "POST", cache: "no-store" });
          if (!cancelled && res.ok) router.refresh();
        } catch {
          if (!cancelled) setStatus("disconnected");
        }
      }, DEMO_TICK_MS);

      return () => {
        cancelled = true;
        clearInterval(id);
        setStatus("connecting");
      };
    }

    // REAL MODE: subscribe to Supabase realtime postgres_changes.
    const supabase = getSupabaseBrowserClient();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    function scheduleRefresh() {
      if (cancelled) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    }

    async function start() {
      // CRITICAL: with @supabase/ssr the session lives in cookies, but the realtime
      // websocket needs the JWT explicitly. Without this, the channel will subscribe
      // as `anon`, RLS will silently filter every postgres_changes payload, and you
      // get a "live" badge with zero events.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        supabase.realtime.setAuth(token);
      }
      if (cancelled) return;

      const ch = TRIAGE_TABLES.reduce<RealtimeChannel>(
        (acc, table) =>
          acc.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            scheduleRefresh
          ),
        supabase.channel("triage-dashboard-live")
      );

      ch.subscribe((subscribeStatus) => {
        if (cancelled) return;
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("live");
        } else if (
          subscribeStatus === "CHANNEL_ERROR" ||
          subscribeStatus === "TIMED_OUT" ||
          subscribeStatus === "CLOSED"
        ) {
          setStatus("disconnected");
        } else {
          setStatus("connecting");
        }
      });

      channel = ch;
    }

    // Keep the realtime JWT in sync with auth state changes (token refresh,
    // sign-out, etc).
    const { data: authSub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    start();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      authSub.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
      setStatus("connecting");
    };
  }, [router, setStatus]);

  return null;
}
