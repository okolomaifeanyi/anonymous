import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getOrganizationByCodeForRoom,
  requireOwnedOrganization,
} from "@/lib/feedback/organizations";

function createSupabaseAuthClient(userId = "user-1") {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
  };
}

function createAdminQuery(
  resolver: (code: string, ownerId: string) => {
    data: Record<string, string> | null;
    error: { message: string } | null;
  },
) {
  let code = "";
  let ownerId = "";

  const query = {
    eq: vi.fn((column: string, value: string) => {
      if (column === "code") {
        code = value;
      }

      if (column === "owner_id") {
        ownerId = value;
      }

      return query;
    }),
    maybeSingle: vi.fn(async () => resolver(code, ownerId)),
    select: vi.fn().mockReturnThis(),
  };

  return query;
}

describe("organization lookups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(createSupabaseAuthClient() as never);
  });

  it("finds legacy lowercase organization codes for admin access", async () => {
    const from = vi.fn(() =>
      createAdminQuery((code, ownerId) => ({
        data:
          code === "united-sons-and-daughters-of-ozu" &&
          ownerId === "user-1"
            ? {
                id: "org-1",
                name: "United Sons and Daughters of Ozubulu",
                code: "united-sons-and-daughters-of-ozu",
                owner_id: "user-1",
                participant_identifier_type: "email",
                participant_identifier_label: "Email address",
              }
            : null,
        error: null,
      })),
    );

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      requireOwnedOrganization("united-sons-and-daughters-of-ozu"),
    ).resolves.toMatchObject({
      code: "united-sons-and-daughters-of-ozu",
      owner_id: "user-1",
    });

    expect(from).toHaveBeenCalledTimes(1);
  });

  it("falls back to uppercase organization codes for room access", async () => {
    const from = vi.fn(() =>
      createAdminQuery((code) => ({
        data:
          code === "USDO-12345"
            ? {
                id: "org-2",
                name: "United Sons and Daughters of Ozubulu",
                code: "USDO-12345",
                participant_identifier_type: "email",
                participant_identifier_label: "Email address",
              }
            : null,
        error: null,
      })),
    );

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      getOrganizationByCodeForRoom("usdo-12345"),
    ).resolves.toMatchObject({
      code: "USDO-12345",
    });

    expect(from).toHaveBeenCalledTimes(2);
  });
});
