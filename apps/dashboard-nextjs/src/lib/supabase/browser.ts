"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cached) return cached;

  const { url, anonKey } = getSupabasePublicEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}
