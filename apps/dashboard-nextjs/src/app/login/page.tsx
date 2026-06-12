import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import { MagicLinkForm } from "./magic-link-form";

export const metadata = { title: "Sign in - Triage Dashboard" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized:
    "That account isn't on the operator allowlist. Ask an admin to add you, then try again.",
  missing_code: "Magic link was missing a verification code. Request a new one."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Sign out unauthorized users so they can retry as a different account.
  if (user && error === "not_authorized") {
    await supabase.auth.signOut();
  } else if (user) {
    redirect("/inbox");
  }

  const errorMessage = error ? ERROR_MESSAGES[error] ?? error : null;

  return (
    <main className="grid min-h-svh place-items-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Triage Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your operator email. We&apos;ll send you a one-time magic link.
          </p>
        </div>
        {errorMessage ? (
          <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <MagicLinkForm />
      </div>
    </main>
  );
}
