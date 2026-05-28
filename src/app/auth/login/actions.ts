"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/server";

const MAGIC_LINK_COOLDOWN_SECONDS = 60;

function buildLoginRedirect(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `/auth/login?${searchParams.toString()}`;
}

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
    redirect(
      buildLoginRedirect({
        error: "missing-email",
        message: "Enter the email address approved for admin access.",
      }),
    );
  }

  let redirectParams:
    | Record<string, string>
    | null = null;

  try {
    const siteUrl = await getSiteUrl();
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase magic link error:", {
        email,
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
      });

      redirectParams = {
        error: "supabase-auth",
        message:
          error.code === "over_email_send_rate_limit"
            ? `Too many magic links were sent. Wait ${MAGIC_LINK_COOLDOWN_SECONDS} seconds and try again.`
            : error.message || "Could not send magic link.",
        ...(error.code === "over_email_send_rate_limit"
          ? { cooldown: String(MAGIC_LINK_COOLDOWN_SECONDS) }
          : {}),
      };
    } else {
      redirectParams = {
        sent: "1",
        cooldown: String(MAGIC_LINK_COOLDOWN_SECONDS),
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send magic link.";

    console.error("Magic link request failed:", {
      email,
      message,
      error,
    });

    redirectParams = {
      error: "request-failed",
      message,
    };
  }

  redirect(buildLoginRedirect(redirectParams ?? { sent: "1" }));
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/");
}
