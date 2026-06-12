import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

// Request-scoped Supabase client for server components, route handlers, and server actions.
// Auth state comes from the request cookies, so all queries run as the signed-in user (or as
// the anon role if there is no session) -- meaning RLS is enforced.
export async function getSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll throws when called from a server component (no mutable cookie store).
          // Middleware refreshes the session on every request, so this is safe to ignore here.
        }
      }
    }
  });
}
