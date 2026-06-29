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
      <article className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <h2 className="font-heading text-2xl text-foreground">Overview</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Manage participants, levels, votes, and messages here.
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-[var(--app-card)] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
            Organization code
          </p>
          <p className="mt-2 font-mono text-sm text-foreground/85">
            {organization.code}
          </p>
        </div>
      </article>

      <aside className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <h2 className="font-heading text-xl text-foreground">Next steps</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Go to the admin dashboard or keep editing this workspace.
        </p>
        <Link
          href="/admin"
          className="button-surface mt-6 inline-flex items-center px-4 py-2 text-sm font-medium transition"
        >
          Back to admin
        </Link>
      </aside>
    </section>
  );
}
