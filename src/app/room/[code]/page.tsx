import { notFound } from "next/navigation";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

import Breadcrumbs from "@/components/breadcrumbs";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";

export default async function ParticipantRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await getOrganizationByCodeForRoom(code).catch(
    () => null,
  );

  if (!organization) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f15] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
            Participant room
          </div>
          <h1 className="mt-5 font-heading text-3xl md:text-4xl">
            {organization.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
            You are in the participant entry path for this organization.
            Verification, voting, and anonymous message submission continue
            here in the next implementation pass.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0f141d] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Room code
              </p>
              <p className="mt-2 font-mono text-sm text-white/85">
                {organization.code}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0f141d] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Verification method
              </p>
              <p className="mt-2 text-sm text-white/85">
                {organization.participant_identifier_label}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
