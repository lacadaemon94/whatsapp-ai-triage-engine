import "server-only";

import { redirect } from "next/navigation";

import { isDemoMode } from "@/lib/demo/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type OperatorContext = {
  userId: string;
  email: string;
  role: "operator" | "admin";
};

const DEMO_OPERATOR: OperatorContext = {
  userId: "demo-operator",
  email: "demo@example.com",
  role: "admin"
};

// Loads the current session, confirms the user is on the triage_operators allowlist,
// and returns the operator context. Server actions should call this FIRST, before any
// service-role write, so RLS isn't the only thing standing between an attacker and a mutation.
export async function requireOperator(): Promise<OperatorContext> {
  if (isDemoMode()) return DEMO_OPERATOR;

  const supabase = await getSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: operator, error } = await supabase
    .from("triage_operators")
    .select("role, active, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Operator check failed: ${error.message}`);
  }

  if (!operator || !operator.active) {
    redirect("/login?error=not_authorized");
  }

  return {
    userId: user.id,
    email: operator.email,
    role: operator.role as "operator" | "admin"
  };
}
