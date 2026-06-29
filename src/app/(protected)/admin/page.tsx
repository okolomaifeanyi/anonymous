import Link from "next/link";

import AdminShell from "@/components/admin-shell";
import { listOwnedOrganizations } from "@/lib/feedback/organizations";

export default async function AdminPage() {
  const organizations = await listOwnedOrganizations();

  return (
    <AdminShell
      title="Admin dashboard"
      description="Create and manage workspaces."
    >
      <section className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl">Your organizations</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Open a workspace or create one.
            </p>
          </div>
          <Link
            href="/admin/org/new"
            className="button-surface inline-flex w-fit items-center px-5 py-3 text-sm font-semibold transition"
          >
            Create workspace
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.length > 0 ? (
            organizations.map((organization) => (
              <article
                key={organization.id}
                className="rounded-3xl border border-border bg-[var(--app-card)] p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
                  Org
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {organization.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {organization.participant_identifier_label}
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground/60">
                  {organization.code}
                </p>
                <Link
                  href={`/admin/org/${organization.code}`}
                  className="button-surface mt-5 inline-flex items-center px-4 py-2 text-sm font-medium transition"
                >
                  Open
                </Link>
              </article>
            ))
          ) : (
            <article className="rounded-3xl border border-dashed border-border bg-muted/50 p-6 md:col-span-2 xl:col-span-3">
              <h3 className="text-lg font-semibold text-foreground">
                No workspaces yet
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Create one to begin.
              </p>
            </article>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
