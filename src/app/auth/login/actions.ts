"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect("/auth/login?error=1");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect("/auth/login?error=1");
  }

  redirect("/auth/login?sent=1");
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/");
}
