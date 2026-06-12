"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { PanelRight } from "@/components/ui/icon";

export function RightRail({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden h-full min-w-0 flex-col gap-3 overflow-auto xl:flex" aria-label="Conversation details">
      {children}
    </aside>
  );
}

export function RightRailSheetTrigger({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Details">
          <PanelRight className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Conversation details</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 overflow-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
