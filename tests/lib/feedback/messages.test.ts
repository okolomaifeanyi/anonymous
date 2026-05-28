import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/server";
import {
  createMessageChannel,
  listParticipantRoomRevealedMessages,
} from "@/lib/feedback/messages";

describe("feedback message helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a participant-reveal channel and stores the selected participants", async () => {
    const channelInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "channel-1",
          title: "Leadership feedback",
          prompt: "What should leadership hear this week?",
          status: "open",
          reveal_audience_type: "participants",
          submit_level_ids: ["public"],
          reveal_level_ids: [],
          created_at: "2026-05-28T00:00:00.000Z",
        },
        error: null,
      }),
    });
    const participantLookupQuery = {
      eq: vi.fn(),
      in: vi.fn(),
    };
    participantLookupQuery.eq.mockReturnValue(participantLookupQuery);
    participantLookupQuery.in.mockResolvedValue({
      data: [{ id: "participant-1" }, { id: "participant-2" }],
      error: null,
    });
    const revealParticipantInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "message_channels") {
        return { insert: channelInsert };
      }

      if (table === "organization_participants") {
        return {
          select: vi.fn(() => participantLookupQuery),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return { insert: revealParticipantInsert };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      createMessageChannel({
        organizationId: "org-1",
        title: "Leadership feedback",
        prompt: "What should leadership hear this week?",
        submitLevelIds: ["public"],
        revealAudienceType: "participants",
        revealLevelIds: ["public"],
        revealParticipantIds: ["participant-1", "participant-2"],
        status: "open",
      }),
    ).resolves.toMatchObject({
      id: "channel-1",
      reveal_audience_type: "participants",
      reveal_level_ids: [],
    });

    expect(channelInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        reveal_audience_type: "participants",
        reveal_level_ids: [],
      }),
    );
    expect(revealParticipantInsert).toHaveBeenCalledWith([
      {
        channel_id: "channel-1",
        participant_id: "participant-1",
        organization_id: "org-1",
      },
      {
        channel_id: "channel-1",
        participant_id: "participant-2",
        organization_id: "org-1",
      },
    ]);
  });

  it("loads participant reveal audiences into participant-room messages", async () => {
    const messageEntriesQuery = {
      eq: vi.fn(),
      order: vi.fn(),
    };
    messageEntriesQuery.eq.mockReturnValue(messageEntriesQuery);
    messageEntriesQuery.order.mockResolvedValue({
      data: [
        {
          id: "message-1",
          body: "Please share this privately.",
          revealed: true,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_id: "channel-1",
          message_channels: {
            title: "Leadership feedback",
            organization_id: "org-1",
            reveal_audience_type: "participants",
            reveal_level_ids: [],
          },
        },
      ],
      error: null,
    });

    const revealParticipantsQuery = {
      eq: vi.fn(),
      order: vi.fn(),
    };
    revealParticipantsQuery.eq.mockReturnValue(revealParticipantsQuery);
    revealParticipantsQuery.order.mockResolvedValue({
      data: [{ channel_id: "channel-1", participant_id: "participant-1" }],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
          select: vi.fn(() => messageEntriesQuery),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return {
          select: vi.fn(() => revealParticipantsQuery),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      listParticipantRoomRevealedMessages("org-1"),
    ).resolves.toEqual([
      {
        id: "message-1",
        body: "Please share this privately.",
        revealed: true,
        createdAt: "2026-05-28T00:00:00.000Z",
        channelId: "channel-1",
        channelTitle: "Leadership feedback",
        revealAudienceType: "participants",
        revealLevelIds: [],
        revealParticipantIds: ["participant-1"],
      },
    ]);
  });
});
