import type { ReactNode } from "react";

import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";

export default async function AdminOrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await requireOwnedOrganization(code);

  return (
    <AdminShell
      title={organization.name}
      description="Manage people, levels, votes, and messages."
      code={organization.code}
    >
      {children}
    </AdminShell>
  );
}
