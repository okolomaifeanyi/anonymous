import { cookies } from "next/headers";

export type RoomSession = {
  organizationId: string;
  participantId: string;
};

const ROOM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function buildRoomCookieName(organizationId: string) {
  return `anon-room-${organizationId}`;
}

export function serializeRoomSession(input: RoomSession): RoomSession {
  return {
    organizationId: input.organizationId,
    participantId: input.participantId,
  };
}

export function parseRoomSession(
  value: string | null | undefined,
): RoomSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<RoomSession>;

    if (
      typeof parsed.organizationId !== "string" ||
      typeof parsed.participantId !== "string"
    ) {
      return null;
    }

    return serializeRoomSession({
      organizationId: parsed.organizationId,
      participantId: parsed.participantId,
    });
  } catch {
    return null;
  }
}

export async function getRoomSession(
  organizationId: string,
): Promise<RoomSession | null> {
  const cookieStore = await cookies();

  return parseRoomSession(
    cookieStore.get(buildRoomCookieName(organizationId))?.value,
  );
}

export async function setRoomSession(input: RoomSession) {
  const cookieStore = await cookies();

  cookieStore.set(
    buildRoomCookieName(input.organizationId),
    JSON.stringify(serializeRoomSession(input)),
    {
      httpOnly: true,
      maxAge: ROOM_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
}

export async function clearRoomSession(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(buildRoomCookieName(organizationId));
}
