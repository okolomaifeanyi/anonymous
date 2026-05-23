import Link from "next/link";

import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";

export default async function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await requireOwnedOrganization(code);

  return (
    <AdminShell
      title={organization.name}
      description="This overview is the control point for your organization. Use the admin navigation to manage people, access levels, votes, and anonymous message review."
      code={organization.code}
    >
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <h2 className="font-heading text-2xl text-white">Overview</h2>
          <p className="mt-3 text-sm text-white/60">
            Your admin shell is now in place. Add participants, define access
            levels, publish internal votes, and moderate anonymous feedback from
            this organization workspace.
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
            Create your first controlled organization or return to the admin
            dashboard to switch contexts.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to admin
          </Link>
        </aside>
      </section>
    </AdminShell>
  );
}
