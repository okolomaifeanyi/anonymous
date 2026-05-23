"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createLevel, getOrganizationLevels } from "@/lib/feedback/participants";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildLevelsPath(code: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const path = `/admin/org/${code}/levels`;

  return query ? `${path}?${query}` : path;
}

export async function addLevel(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);

  try {
    const levels = await getOrganizationLevels(organization.id);

    await createLevel({
      organizationId: organization.id,
      name: String(formData.get("name") ?? ""),
      position:
        levels.reduce(
          (highestPosition, level) => Math.max(highestPosition, level.position),
          -1,
        ) + 1,
    });
  } catch (error) {
    redirect(
      buildLevelsPath(code, {
        error: getErrorMessage(error, "Unable to add level."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/levels`);
  redirect(buildLevelsPath(code, { status: "level-added" }));
}
