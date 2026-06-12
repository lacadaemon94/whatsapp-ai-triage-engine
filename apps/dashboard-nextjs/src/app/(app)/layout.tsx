import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { isDemoMode } from "@/lib/demo/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Demo mode: no auth, no operator check. Render the shell directly.
  if (isDemoMode()) {
    return <AppShell>{children}</AppShell>;
  }

  const supabase = await getSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS on triage_operators only exposes the caller's own row, so this either
  // returns the operator record or nothing.
  const { data: operator } = await supabase
    .from("triage_operators")
    .select("role, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!operator || !operator.active) {
    redirect("/login?error=not_authorized");
  }

  return <AppShell>{children}</AppShell>;
}
