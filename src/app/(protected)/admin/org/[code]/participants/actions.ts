"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  createParticipant,
  parseParticipantInput,
} from "@/lib/feedback/participants";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildParticipantsPath(code: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const path = `/admin/org/${code}/participants`;

  return query ? `${path}?${query}` : path;
}

export async function addParticipant(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);

  try {
    const participant = parseParticipantInput({
      identifierType: organization.participant_identifier_type,
      identifierValue: String(formData.get("identifierValue") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
    });

    await createParticipant({
      organizationId: organization.id,
      ...participant,
      levelIds: formData.getAll("levelIds").map(String),
    });
  } catch (error) {
    redirect(
      buildParticipantsPath(code, {
        error: getErrorMessage(error, "Unable to add participant."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/participants`);
  redirect(buildParticipantsPath(code, { status: "participant-added" }));
}
