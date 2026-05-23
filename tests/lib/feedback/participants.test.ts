import { describe, expect, it } from "vitest";

import {
  normalizeIdentifierValue,
  parseParticipantInput,
  slugifyLevelName,
} from "@/lib/feedback/participants";

describe("feedback participants helpers", () => {
  it('normalizeIdentifierValue normalizes email values', () => {
    expect(normalizeIdentifierValue("email", "  USER@Example.COM  ")).toBe(
      "user@example.com",
    );
  });

  it("normalizeIdentifierValue normalizes phone values", () => {
    expect(normalizeIdentifierValue("phone", " +234 801 222 3333 ")).toBe(
      "+2348012223333",
    );
  });

  it("normalizeIdentifierValue preserves plus signs in phone values", () => {
    expect(normalizeIdentifierValue("phone", " +234+801-222 3333 ")).toBe(
      "+234+8012223333",
    );
  });

  it("slugifyLevelName creates a level slug", () => {
    expect(slugifyLevelName("Executive Council")).toBe("executive-council");
  });

  it("parseParticipantInput rejects blank identifier values", () => {
    expect(() =>
      parseParticipantInput({
        identifierType: "email",
        identifierValue: "   ",
        displayName: "Member",
      }),
    ).toThrow("Participant identifier is required.");
  });

  it("parseParticipantInput normalizes the identifier and trims display name", () => {
    expect(
      parseParticipantInput({
        identifierType: "email",
        identifierValue: "  USER@Example.COM ",
        displayName: "  Executive Team  ",
      }),
    ).toEqual({
      identifierType: "email",
      identifierValue: "user@example.com",
      displayName: "Executive Team",
    });
  });

  it("parseParticipantInput converts blank display names to null", () => {
    expect(
      parseParticipantInput({
        identifierType: "phone",
        identifierValue: " +234 801 111 2222 ",
        displayName: "   ",
      }),
    ).toEqual({
      identifierType: "phone",
      identifierValue: "+2348011112222",
      displayName: null,
    });
  });
});
