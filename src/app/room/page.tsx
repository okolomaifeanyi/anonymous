import { redirect } from "next/navigation";

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
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">
              Participant room entry
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              Enter your room code
            </h1>
            <p className="max-w-xl text-sm text-white/65 md:text-base">
              Use the room code shared by your organizer to continue into the
              participant space.
            </p>
          </div>

          <form action="/room" method="get" className="mt-8 space-y-4">
            <label htmlFor="room-code" className="block text-sm text-white/70">
              Room code
            </label>
            <input
              id="room-code"
              name="code"
              required
              className="w-full rounded-2xl border border-white/10 bg-[#0f141d] px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-white/90"
            >
              Continue
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
