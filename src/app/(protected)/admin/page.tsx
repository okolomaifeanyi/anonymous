import Link from "next/link";

import AdminShell from "@/components/admin-shell";

export default function AdminPage() {
  return (
    <AdminShell
      title="Admin dashboard"
      description="Create and manage organizations for verified anonymous feedback, controlled participation, and internal voting."
    >
      <section className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <h2 className="font-heading text-2xl text-white">Start a new workspace</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/60">
          Create an organization before inviting participants or publishing room
          links.
        </p>
        <Link
          href="/admin/org/new"
          className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-white/90"
        >
          Create organization
        </Link>
      </section>
    </AdminShell>
  );
}
