import AdminShell from "@/components/admin-shell";

import { createOrgAction } from "./actions";

export default function NewAdminOrganizationPage() {
  return (
    <AdminShell
      title="Create organization"
      description="Set up the organization shell your admins will use to manage participants, levels, votes, and messages."
    >
      <section className="max-w-2xl rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <form action={createOrgAction} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="organization-name"
              className="text-sm font-medium text-white/75"
            >
              Organization name
            </label>
            <input
              id="organization-name"
              name="name"
              required
              placeholder="Pulse, Operations Council, Design Forum..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-white/90"
          >
            Create organization
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
