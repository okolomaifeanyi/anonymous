import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type RoomSession = {
  organizationId: string;
  participantId: string;
};

const ROOM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getRoomSessionSecret() {
  const secret =
    process.env.ROOM_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing room session secret. Set ROOM_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return secret;
}

function signRoomSessionPayload(payload: string) {
  return createHmac("sha256", getRoomSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function buildRoomCookieName(organizationId: string) {
  return `anon-room-${organizationId}`;
}

export function serializeRoomSession(input: RoomSession): RoomSession {
  return {
    organizationId: input.organizationId,
    participantId: input.participantId,
  };
}

export function encodeRoomSession(input: RoomSession) {
  const payload = Buffer.from(
    JSON.stringify(serializeRoomSession(input)),
    "utf8",
  ).toString("base64url");

  return `${payload}.${signRoomSessionPayload(payload)}`;
}

export function parseRoomSession(
  value: string | null | undefined,
): RoomSession | null {
  if (!value) {
    return null;
  }

  try {
    const [payload, providedSignature, ...rest] = value.split(".");

    if (!payload || !providedSignature || rest.length > 0) {
      return null;
    }

    const expectedSignature = signRoomSessionPayload(payload);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<RoomSession>;

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
    encodeRoomSession(input),
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
