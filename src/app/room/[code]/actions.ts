"use server";

import { redirect } from "next/navigation";

import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import {
  findEligibleParticipantByIdentifier,
  normalizeIdentifierValue,
} from "@/lib/feedback/participants";
import { setRoomSession } from "@/lib/feedback/room-session";

function buildRoomAccessPath(
  code: string,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  const path = `/room/${code}`;

  return query ? `${path}?${query}` : path;
}

export async function verifyParticipant(code: string, formData: FormData) {
  const organization = await getOrganizationByCodeForRoom(code);
  const identifierValue = normalizeIdentifierValue(
    organization.participant_identifier_type,
    String(formData.get("identifierValue") ?? ""),
  );

  if (!identifierValue) {
    redirect(
      buildRoomAccessPath(code, {
        error: "identifier-required",
      }),
    );
  }

  const participant = await findEligibleParticipantByIdentifier({
    organizationId: organization.id,
    identifierType: organization.participant_identifier_type,
    identifierValue,
  }).catch(() => null);

  if (!participant) {
    redirect(
      buildRoomAccessPath(code, {
        error: "access-denied",
      }),
    );
  }

  await setRoomSession({
    organizationId: organization.id,
    participantId: participant.id,
  });

  redirect(`/room/${code}/space`);
}
