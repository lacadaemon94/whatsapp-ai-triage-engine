"use client";

import * as React from "react";

export type RealtimeStatus = "connecting" | "live" | "disconnected";

type Ctx = {
  status: RealtimeStatus;
  setStatus: (status: RealtimeStatus) => void;
};

const RealtimeStatusContext = React.createContext<Ctx | null>(null);

export function RealtimeStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<RealtimeStatus>("connecting");
  const value = React.useMemo(() => ({ status, setStatus }), [status]);
  return (
    <RealtimeStatusContext.Provider value={value}>{children}</RealtimeStatusContext.Provider>
  );
}

// Safe to call outside the provider -- returns "live" so the indicator never shows
// a misleading "disconnected" badge on pages that don't have realtime wired.
export function useRealtimeStatus(): RealtimeStatus {
  const ctx = React.useContext(RealtimeStatusContext);
  return ctx?.status ?? "live";
}

export function useRealtimeStatusSetter() {
  const ctx = React.useContext(RealtimeStatusContext);
  return ctx?.setStatus ?? (() => {});
}
