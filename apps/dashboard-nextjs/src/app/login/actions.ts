"use server";

import { headers } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SendMagicLinkState = {
  status: "idle" | "sent" | "error";
  message: string | null;
};

export async function sendMagicLink(
  _prevState: SendMagicLinkState,
  formData: FormData
): Promise<SendMagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "Enter your work email." };
  }

  const supabase = await getSupabaseServerClient();
  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    (hdrs.get("host") ? `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host")}` : "http://localhost:3000");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true
    }
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "sent",
    message: "Check your inbox for a magic link. It expires in a few minutes."
  };
}
