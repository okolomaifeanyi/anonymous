import { describe, expect, it } from "vitest";

import {
  buildOrganizationCodePrefix,
  normalizeOrganizationCode,
} from "@/lib/feedback/organization-code";

describe("organization code helpers", () => {
  it("builds initials from significant words only", () => {
    expect(
      buildOrganizationCodePrefix("United Sons and Daughters of Ozubulu"),
    ).toBe("USDO");
  });

  it("falls back to the first available words when stop words are removed", () => {
    expect(buildOrganizationCodePrefix("And Of The")).toBe("AOT");
  });

  it("normalizes organization codes to uppercase", () => {
    expect(normalizeOrganizationCode(" usdo-12345 ")).toBe("USDO-12345");
  });
});
