import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";
import RateLimitBanner from "@/components/rate-limit-banner";

import { requestMagicLink } from "./actions";
import SubmitButton from "./submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    cooldown?: string;
    sent?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const resolved = await searchParams;
  const sent = resolved?.sent === "1";
  const errorMessage = resolved?.message?.trim() || null;
  const hasError = Boolean(resolved?.error || errorMessage);
  const parsedCooldown = Number.parseInt(resolved?.cooldown ?? "", 10);
  const initialCooldown =
    Number.isFinite(parsedCooldown) && parsedCooldown > 0 ? parsedCooldown : 0;
  const isRateLimited =
    resolved?.error === "supabase-auth" && initialCooldown > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            Admin access
          </div>
          <h1 className="font-heading text-3xl md:text-4xl">
            Sign in to open the admin shell
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            We&apos;ll send a secure magic link so you can manage organizations,
            review anonymous feedback, and control internal voting.
          </p>
        </header>

        <div className="rounded-3xl border border-border bg-[var(--app-surface)] p-8">
          <form action={requestMagicLink} className="space-y-5">
            <label
              htmlFor="email"
              className="block text-sm text-muted-foreground"
            >
              Email address
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3">
              <EnvelopeIcon className="h-5 w-5 text-muted-foreground/50" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-transparent text-sm text-foreground/90 focus:outline-none"
              />
            </div>
            <SubmitButton
              key={`${resolved?.sent ?? "0"}:${resolved?.error ?? "none"}:${initialCooldown}`}
              initialCooldown={initialCooldown}
            />
          </form>
          {sent && (
            <p className="mt-4 text-center text-xs text-emerald-600 dark:text-emerald-200">
              Magic link requested. Check your inbox and spam.
            </p>
          )}
          {hasError &&
            (isRateLimited ? (
              <RateLimitBanner
                className="mt-4 text-center text-xs text-rose-600 dark:text-rose-200"
                prefix="Email provider rate limit exceeded. Wait "
                suffix=" seconds and try again."
                initialSeconds={initialCooldown}
              />
            ) : (
              <p className="mt-4 text-center text-xs text-rose-600 dark:text-rose-200">
                {errorMessage ?? "Could not send magic link. Try again."}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
