import Link from "next/link";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";

export default async function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await requireOwnedOrganization(code);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <h2 className="font-heading text-2xl text-white">Overview</h2>
        <p className="mt-3 text-sm text-white/60">
          Manage participants, levels, votes, and messages here.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
            Organization code
          </p>
          <p className="mt-2 font-mono text-sm text-white/85">
            {organization.code}
          </p>
        </div>
      </article>

      <aside className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <h2 className="font-heading text-xl text-white">Next steps</h2>
        <p className="mt-3 text-sm text-white/60">
          Go to the admin dashboard or keep editing this workspace.
        </p>
        <Link
          href="/admin"
          className="button-surface mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          Back to admin
        </Link>
      </aside>
    </section>
  );
}
