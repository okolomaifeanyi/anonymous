import { notFound, redirect } from "next/navigation";

import ParticipantRoom from "@/components/participant-room";
import { getParticipantRoomData } from "@/lib/feedback/participants";

type ParticipantRoomSpacePageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getStatusMessage(status: string | undefined) {
  if (status === "vote-recorded") {
    return "Your vote was recorded.";
  }

  if (status === "message-submitted") {
    return "Your message was submitted for organizer review.";
  }

  if (status === "message-revealed") {
    return "Your message is now visible to the wider audience.";
  }

  return null;
}

export default async function ParticipantRoomSpacePage({
  params,
  searchParams,
}: ParticipantRoomSpacePageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const roomResult = await getParticipantRoomData(code)
    .then((room) => ({ room }))
    .catch((error) => {
      if (
        error instanceof Error &&
        error.message === "Organization not found."
      ) {
        return { room: null, shouldNotFound: true };
      }

      throw error;
    });

  if ("shouldNotFound" in roomResult && roomResult.shouldNotFound) {
    notFound();
  }

  const room = roomResult.room;

  if (!room) {
    redirect(`/room/${code}`);
  }

  return (
    <ParticipantRoom
      room={room}
      error={readSearchParam(resolvedSearchParams, "error") ?? null}
      status={getStatusMessage(readSearchParam(resolvedSearchParams, "status"))}
    />
  );
}
