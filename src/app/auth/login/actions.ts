"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/server";

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    throw new Error(
      "Missing NEXT_PUBLIC_SITE_URL and could not derive the current host.",
    );
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  return `${protocol}://${host}`;
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect("/auth/login?error=1");
  }

  const siteUrl = await getSiteUrl();
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
