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
      description="This overview is the control point for your organization. Use the admin navigation to manage people, access levels, votes, and anonymous message review."
      code={organization.code}
    >
      {children}
    </AdminShell>
  );
}
