// Demo-mode flag. Read on both server and client.
//
// When DEMO_MODE=true the dashboard runs entirely against the in-memory store
// in `./store.ts`: no Supabase, no n8n, no auth. Perfect for a `docker compose
// up` first-look or a public case-study deploy.

export function isDemoMode(): boolean {
  // Server can read the unprefixed flag; client can't.
  if (typeof process === "undefined") return false;
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

// Client-only variant — only reads the NEXT_PUBLIC_ prefix because the
// unprefixed `DEMO_MODE` isn't exposed to client bundles.
export function isClientDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
