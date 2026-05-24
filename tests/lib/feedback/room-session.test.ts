import { describe, expect, it } from "vitest";

import {
  buildRoomCookieName,
  encodeRoomSession,
  parseRoomSession,
  serializeRoomSession,
} from "@/lib/feedback/room-session";

describe("room session helpers", () => {
  process.env.ROOM_SESSION_SECRET = "test-room-session-secret";

  it("builds a stable cookie name per organization", () => {
    expect(buildRoomCookieName("org-123")).toBe("anon-room-org-123");
  });

  it("serializes the participant room session", () => {
    expect(
      serializeRoomSession({
        organizationId: "org-123",
        participantId: "part-456",
      }),
    ).toEqual({
      organizationId: "org-123",
      participantId: "part-456",
    });
  });

  it("parses a serialized participant room session", () => {
    expect(
      parseRoomSession(
        encodeRoomSession({
          organizationId: "org-123",
          participantId: "part-456",
        }),
      ),
    ).toEqual({
      organizationId: "org-123",
      participantId: "part-456",
    });
  });

  it("rejects malformed participant room session payloads", () => {
    expect(
      parseRoomSession(
        `${Buffer.from(
          JSON.stringify({
            organizationId: "org-123",
          }),
          "utf8",
        ).toString("base64url")}.bad-signature`,
      ),
    ).toBeNull();
    expect(
      parseRoomSession(
        `${Buffer.from(
          JSON.stringify({
            organizationId: "org-123",
            participantId: "part-456",
          }),
          "utf8",
        ).toString("base64url")}.bad-signature`,
      ),
    ).toBeNull();
    expect(parseRoomSession("not-json")).toBeNull();
    expect(parseRoomSession("")).toBeNull();
  });
});
