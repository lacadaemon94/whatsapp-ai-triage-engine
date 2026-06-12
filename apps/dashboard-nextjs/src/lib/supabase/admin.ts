import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Use ONLY from trusted server code
// (server actions that have already authenticated + authorized the caller,
// webhook handlers, edge functions). Never expose to the browser.
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run the dashboard through npm scripts so scripts/next-with-root-env.mjs can load the repo root .env."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
