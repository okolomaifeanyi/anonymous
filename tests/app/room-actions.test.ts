import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  findEligibleParticipantByIdentifier: vi.fn(),
  getOrganizationByCodeForRoom: vi.fn(),
  setRoomSession: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

vi.mock("@/lib/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/feedback/organizations", () => ({
  getOrganizationByCodeForRoom: mocks.getOrganizationByCodeForRoom,
}));

vi.mock("@/lib/feedback/participants", () => ({
  findEligibleParticipantByIdentifier: mocks.findEligibleParticipantByIdentifier,
  normalizeIdentifierValue: (type: string, value: string) => {
    const trimmed = value.trim();

    return type === "email" ? trimmed.toLowerCase() : trimmed;
  },
}));

vi.mock("@/lib/feedback/room-session", () => ({
  setRoomSession: mocks.setRoomSession,
}));

import { verifyParticipant } from "@/app/room/[code]/actions";

function createSupabaseAuthClient() {
  return {
    auth: {
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
    },
  };
}

describe("participant room actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(createSupabaseAuthClient());
    mocks.getOrganizationByCodeForRoom.mockResolvedValue({
      id: "org-1",
      participant_identifier_type: "email",
    });
    mocks.findEligibleParticipantByIdentifier.mockResolvedValue({
      id: "participant-1",
    });
  });

  it("sends a verification code to an approved email", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("intent", "request");
    formData.set("identifierValue", "USER@Example.com");

    await expect(verifyParticipant("pulse", formData)).rejects.toThrow(
      "REDIRECT:/room/pulse?status=code-sent&cooldown=60&step=code&identifier=user%40example.com",
    );

    expect(mocks.findEligibleParticipantByIdentifier).toHaveBeenCalledWith({
      organizationId: "org-1",
      identifierType: "email",
      identifierValue: "user@example.com",
    });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        shouldCreateUser: true,
      },
    });
    expect(mocks.setRoomSession).not.toHaveBeenCalled();
  });

  it("includes a resend cooldown after sending a verification code", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("intent", "request");
    formData.set("identifierValue", "USER@Example.com");

    await expect(verifyParticipant("pulse", formData)).rejects.toThrow(
      "REDIRECT:/room/pulse?status=code-sent&cooldown=60&step=code&identifier=user%40example.com",
    );
  });

  it("shows the cooldown count when code sending is rate limited", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: {
        code: "over_email_send_rate_limit",
        message: "",
      },
    });

    const formData = new FormData();
    formData.set("intent", "request");
    formData.set("identifierValue", "USER@Example.com");

    await expect(verifyParticipant("pulse", formData)).rejects.toThrow(
      "REDIRECT:/room/pulse?error=rate-limited&message=Too+many+codes+were+sent.+Wait+60+seconds+and+try+again.&cooldown=60&step=code&identifier=user%40example.com",
    );
  });

  it("verifies a code and opens the participant room", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("intent", "verify");
    formData.set("identifierValue", "user@example.com");
    formData.set("code", "123456");

    await expect(verifyParticipant("pulse", formData)).rejects.toThrow(
      "REDIRECT:/room/pulse/space",
    );

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
    expect(mocks.setRoomSession).toHaveBeenCalledWith({
      organizationId: "org-1",
      participantId: "participant-1",
    });
  });

  it("keeps non-email identifiers on the direct entry flow", async () => {
    mocks.getOrganizationByCodeForRoom.mockResolvedValue({
      id: "org-1",
      participant_identifier_type: "phone",
    });

    const formData = new FormData();
    formData.set("identifierValue", "+234 801 222 3333");

    await expect(verifyParticipant("pulse", formData)).rejects.toThrow(
      "REDIRECT:/room/pulse/space",
    );

    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.setRoomSession).toHaveBeenCalledWith({
      organizationId: "org-1",
      participantId: "participant-1",
    });
  });
});
