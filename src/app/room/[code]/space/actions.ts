"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createParticipantMessageEntry,
  toggleMessageReveal,
} from "@/lib/feedback/messages";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import { getParticipantRoomContext } from "@/lib/feedback/participants";
import { clearRoomSession } from "@/lib/feedback/room-session";
import { castParticipantVote, type VoteChoice } from "@/lib/feedback/votes";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildRoomSpacePath(
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
  const path = `/room/${code}/space`;

  return query ? `${path}?${query}` : path;
}

function parseVoteChoice(value: string): VoteChoice {
  if (value === "support" || value === "oppose") {
    return value;
  }

  throw new Error("Vote choice is invalid.");
}

async function requireParticipantRoomContext(code: string) {
  const context = await getParticipantRoomContext(code);

  if (!context) {
    redirect(`/room/${code}`);
  }

  return context;
}

export async function submitParticipantVote(code: string, formData: FormData) {
  const context = await requireParticipantRoomContext(code);

  try {
    await castParticipantVote({
      organizationId: context.organization.id,
      participantId: context.participant.id,
      participantLevelIds: context.participant.levelIds,
      voteId: String(formData.get("voteId") ?? ""),
      choice: parseVoteChoice(String(formData.get("choice") ?? "")),
    });
  } catch (error) {
    redirect(
      buildRoomSpacePath(code, {
        error: getErrorMessage(error, "Unable to record your vote."),
      }),
    );
  }

  revalidatePath(`/room/${code}/space`);
  redirect(
    buildRoomSpacePath(code, {
      status: "vote-recorded",
    }),
  );
}

export async function submitParticipantMessage(
  code: string,
  formData: FormData,
) {
  const context = await requireParticipantRoomContext(code);

  try {
    await createParticipantMessageEntry({
      organizationId: context.organization.id,
      participantId: context.participant.id,
      participantLevelIds: context.participant.levelIds,
      channelId: String(formData.get("channelId") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
  } catch (error) {
    redirect(
      buildRoomSpacePath(code, {
        error: getErrorMessage(error, "Unable to submit your message."),
      }),
    );
  }

  revalidatePath(`/room/${code}/space`);
  redirect(
    buildRoomSpacePath(code, {
      status: "message-submitted",
    }),
  );
}

export async function revealParticipantMessage(
  code: string,
  formData: FormData,
) {
  const context = await requireParticipantRoomContext(code);

  try {
    await toggleMessageReveal({
      messageId: String(formData.get("messageId") ?? ""),
      organizationId: context.organization.id,
      participantId: context.participant.id,
      revealed: true,
    });
  } catch (error) {
    redirect(
      buildRoomSpacePath(code, {
        error: getErrorMessage(error, "Unable to reveal your message."),
      }),
    );
  }

  revalidatePath(`/room/${code}/space`);
  redirect(
    buildRoomSpacePath(code, {
      status: "message-revealed",
    }),
  );
}

export async function leaveParticipantRoom(code: string, formData: FormData) {
  void formData;

  const organization = await getOrganizationByCodeForRoom(code).catch(
    () => null,
  );

  if (!organization) {
    redirect("/room");
  }

  await clearRoomSession(organization.id);
  redirect(`/room/${code}?status=signed-out`);
}
