import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import Breadcrumbs from "@/components/breadcrumbs";

import { requestMagicLink } from "./actions";
import SubmitButton from "./submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const resolved = await searchParams;
  const sent = resolved?.sent === "1";
  const errorMessage = resolved?.message?.trim() || null;
  const hasError = Boolean(resolved?.error || errorMessage);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f15] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
            Admin access
          </div>
          <h1 className="font-heading text-3xl md:text-4xl">
            Sign in to open the admin shell
          </h1>
          <p className="text-sm text-white/60 md:text-base">
            We&apos;ll send a secure magic link so you can manage organizations,
            review anonymous feedback, and control internal voting.
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <form action={requestMagicLink} className="space-y-5">
            <label className="block text-sm text-white/70">Email address</label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f141d] px-4 py-3">
              <EnvelopeIcon className="h-5 w-5 text-white/50" />
              <input
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <SubmitButton />
          </form>
          {sent && (
            <p className="mt-4 text-center text-xs text-emerald-200">
              Magic link sent. Check your inbox for admin access.
            </p>
          )}
          {hasError && (
            <p className="mt-4 text-center text-xs text-rose-200">
              {errorMessage ?? "Could not send magic link. Try again."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
