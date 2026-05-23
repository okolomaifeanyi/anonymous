import { requireOwnedOrganization } from "@/lib/feedback/organizations";

export default async function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await requireOwnedOrganization(code);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{organization.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Organization code: {organization.code}
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Organizer admin tools will be added here in a later task.
      </p>
    </main>
  );
}
