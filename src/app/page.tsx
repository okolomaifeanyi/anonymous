import Link from "next/link";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10">
        <Breadcrumbs />

        <section className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Link
            href="/auth/login"
            className="button-surface button-surface-admin absolute right-0 top-0 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition sm:px-5 sm:py-2.5"
          >
            Admin sign in
          </Link>

          <div className="space-y-6 pt-10 lg:pt-0">
            <h1 className="font-heading text-4xl leading-tight md:text-5xl">
              Anonymous voting and feedback for organizations.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Admins manage the workspace. Participants join private rooms to
              vote and send feedback without exposing their identity.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground/80">
              <span className="inline-flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-foreground/80" />
                Verified access
              </span>
              <span className="hidden h-4 w-px bg-border md:block" />
              <span className="inline-flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-foreground/80" />
                Private feedback rooms
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/room"
                className="button-surface group inline-flex items-center justify-center gap-3 px-7 py-4 text-base font-semibold transition hover:-translate-y-0.5 sm:px-8"
              >
                Enter room
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Admin-managed workspaces",
                description: "Create and manage each workspace from one place.",
                icon: ShieldCheckIcon,
              },
              {
                title: "Private participant rooms",
                description:
                  "People see only the votes and messages meant for them.",
                icon: LockClosedIcon,
              },
              {
                title: "Clear internal signals",
                description: "Collect feedback you can act on.",
                icon: CheckBadgeIcon,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-muted/50 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                    <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
