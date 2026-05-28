import Link from "next/link";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import Breadcrumbs from "@/components/breadcrumbs";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f15] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10">
        <Breadcrumbs />

        <section className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Link
            href="/auth/login"
            className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/65 transition hover:bg-white/10 hover:text-white sm:px-5 sm:py-2.5"
          >
            Admin sign in
          </Link>

          <div className="space-y-6 pt-10 lg:pt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/70">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
              Verified anonymous feedback
            </div>
            <h1 className="font-heading text-4xl leading-tight md:text-5xl">
              Controlled internal voting with verified anonymous participation.
            </h1>
            <p className="max-w-2xl text-base text-white/70 md:text-lg">
              Give administrators a secure shell to manage organizations, while
              participants enter dedicated rooms to send honest feedback and
              vote without public exposure.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="inline-flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-white/80" />
                Verified access
              </span>
              <span className="hidden h-4 w-px bg-white/20 md:block" />
              <span className="inline-flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-white/80" />
                Private feedback rooms
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/room"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0b0f15] shadow-lg shadow-white/10 transition hover:-translate-y-0.5 sm:px-8"
              >
                Enter room
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Admin sign in
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Admin-controlled organizations",
                description:
                  "Each organization gets a dedicated shell for oversight and follow-up.",
                icon: ShieldCheckIcon,
              },
              {
                title: "Scoped participant rooms",
                description:
                  "Participants enter focused spaces designed for anonymous feedback and voting.",
                icon: LockClosedIcon,
              },
              {
                title: "Decision-ready outputs",
                description:
                  "Collect trustworthy internal signals before acting on them.",
                icon: CheckBadgeIcon,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <item.icon className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-white/60">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              label: "Verified entry",
              value: "1",
              caption: "Admins sign in before managing an organization",
            },
            {
              label: "Anonymous channel",
              value: "2",
              caption: "Messages and voting stay separate from identity",
            },
            {
              label: "Admin shell",
              value: "3",
              caption: "Overview, navigation, and organization controls",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-xs text-white/60">{stat.caption}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
