import { describe, expect, it } from "vitest";

import {
  normalizeIdentifierValue,
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
});
