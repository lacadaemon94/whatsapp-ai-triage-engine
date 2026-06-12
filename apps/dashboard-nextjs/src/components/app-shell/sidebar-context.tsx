"use client";

import * as React from "react";

type SidebarState = { expanded: boolean; toggle: () => void; setExpanded: (v: boolean) => void };

const SidebarContext = React.createContext<SidebarState | null>(null);

const STORAGE_KEY = "wa-sidebar-expanded";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "true") setExpanded(true);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(expanded));
    }
  }, [expanded]);

  const value = React.useMemo<SidebarState>(
    () => ({ expanded, toggle: () => setExpanded((p) => !p), setExpanded }),
    [expanded]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
