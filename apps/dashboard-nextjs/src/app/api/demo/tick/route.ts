import { NextResponse } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { runSimulatorTick } from "@/lib/demo/simulator";
import { demoSnapshotVersion } from "@/lib/demo/store";

// Demo-only endpoint. Drives the realtime simulator: each POST appends a new
// inbound message + classification to a random open conversation, then returns
// the new snapshot version. The client polls this on a timer and calls
// router.refresh() when the version changes.
//
// In real mode this endpoint is a 404 so it can't be used as a write surface.

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const tick = runSimulatorTick();
  return NextResponse.json({
    ok: true,
    tick,
    version: demoSnapshotVersion()
  });
}

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, version: demoSnapshotVersion() });
}
