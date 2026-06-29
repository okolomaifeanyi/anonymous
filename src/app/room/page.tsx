import { redirect } from "next/navigation";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";

export default async function RoomEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const resolved = await searchParams;
  const code = resolved.code?.trim() ?? "";

  if (code) {
    redirect(`/room/${code}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="rounded-[2rem] border border-border bg-[var(--app-surface)] p-8">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl md:text-4xl">Enter room code</h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Use the code from your organizer.
            </p>
          </div>

          <form action="/room" method="get" className="mt-8 space-y-4">
            <label htmlFor="room-code" className="block text-sm text-muted-foreground">
              Room code
            </label>
            <input
              id="room-code"
              name="code"
              required
              className="w-full rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground focus:border-border/60 focus:outline-none"
            />
            <button
              type="submit"
              className="button-surface inline-flex items-center px-5 py-3 text-sm font-semibold transition"
            >
              Open room
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
