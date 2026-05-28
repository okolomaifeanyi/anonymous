import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/server";
import {
  filterAdminVisibleMessageEntries,
  createMessageChannel,
  deleteMessageChannel,
  listMessageChannels,
  listParticipantRoomPrivateMessages,
  toggleMessageReveal,
  listParticipantRoomRevealedMessages,
} from "@/lib/feedback/messages";

function createMaybeSingleQuery(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  return {
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

function createListQuery(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  return {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  };
}

function createSingleInsertQuery(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));

  return { select };
}

function createDeleteQuery(result: {
  error: { message: string } | null;
}) {
  const deleteQuery = {
    eq: vi.fn(),
  };
  deleteQuery.eq.mockImplementationOnce(() => deleteQuery);
  deleteQuery.eq.mockImplementationOnce(() => Promise.resolve(result));

  return deleteQuery;
}

describe("feedback message helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a participant-reveal channel and stores the selected participants", async () => {
    const channelSupportProbe = createMaybeSingleQuery({
      data: { reveal_audience_type: "levels" },
      error: null,
    });
    const revealParticipantSupportProbe = createMaybeSingleQuery({
      data: null,
      error: null,
    });
    const channelInsert = vi.fn(() =>
      createSingleInsertQuery({
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
    );
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
        return {
          select: vi.fn((columns: string) =>
            columns === "reveal_audience_type"
              ? channelSupportProbe
              : createMaybeSingleQuery({
                  data: null,
                  error: { message: "Unexpected select in test" },
                }),
          ),
          insert: channelInsert,
        };
      }

      if (table === "organization_participants") {
        return {
          select: vi.fn(() => participantLookupQuery),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return {
          select: vi.fn((columns: string) =>
            columns === "channel_id"
              ? revealParticipantSupportProbe
              : createMaybeSingleQuery({
                  data: null,
                  error: { message: "Unexpected select in test" },
                }),
          ),
          insert: revealParticipantInsert,
        };
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

  it("deletes a channel and leaves cleanup to cascading foreign keys", async () => {
    const channelLookupQuery = createMaybeSingleQuery({
      data: {
        id: "channel-1",
        organization_id: "org-1",
      },
      error: null,
    });
    const deleteQuery = createDeleteQuery({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "message_channels") {
        return {
          select: vi.fn(() => channelLookupQuery),
          delete: vi.fn(() => deleteQuery),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      deleteMessageChannel({
        organizationId: "org-1",
        channelId: "channel-1",
      }),
    ).resolves.toBeUndefined();

    expect(deleteQuery.eq).toHaveBeenCalledWith("id", "channel-1");
    expect(deleteQuery.eq).toHaveBeenCalledWith("organization_id", "org-1");
  });

  it("hides participant-only messages from the admin messages page until they are revealed", async () => {
    expect(
      filterAdminVisibleMessageEntries([
        {
          id: "message-1",
          channel_id: "channel-1",
          participant_id: "participant-1",
          body: "Private reveal",
          revealed: true,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_title: "Leadership feedback",
          revealAudienceType: "participants",
        },
        {
          id: "message-2",
          channel_id: "channel-2",
          participant_id: "participant-2",
          body: "Public reveal",
          revealed: true,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_title: "General feedback",
          revealAudienceType: "levels",
        },
        {
          id: "message-3",
          channel_id: "channel-1",
          participant_id: "participant-3",
          body: "Still hidden",
          revealed: false,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_title: "Leadership feedback",
          revealAudienceType: "participants",
        },
        {
          id: "message-4",
          channel_id: "channel-3",
          participant_id: "participant-4",
          body: "Hidden group message",
          revealed: false,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_title: "Team feedback",
          revealAudienceType: "levels",
        },
      ]).map((entry) => entry.id),
    ).toEqual(["message-1", "message-2", "message-4"]);
  });

  it("rejects admin reveal changes for participant-only messages", async () => {
    const messageLookupQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          organization_id: "org-1",
          channel_id: "channel-1",
        },
        error: null,
      }),
    };
    const channelLookupQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "channel-1",
          organization_id: "org-1",
          reveal_audience_type: "participants",
        },
        error: null,
      }),
    };
    const updateQuery = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
          select: vi.fn(() => messageLookupQuery),
          update: vi.fn(() => updateQuery),
        };
      }

      if (table === "message_channels") {
        return {
          select: vi.fn(() => channelLookupQuery),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      toggleMessageReveal({
        messageId: "message-1",
        organizationId: "org-1",
        revealed: true,
      }),
    ).rejects.toThrow(
      "Participant-only messages are controlled by the selected participant.",
    );

    expect(updateQuery.select).not.toHaveBeenCalled();
  });

  it("loads unrevealed participant-only messages for the selected participant", async () => {
    const channelSupportProbe = createMaybeSingleQuery({
      data: { reveal_audience_type: "levels" },
      error: null,
    });
    const revealParticipantSupportProbe = createMaybeSingleQuery({
      data: null,
      error: null,
    });
    const messageEntriesQuery = {
      eq: vi.fn(),
      order: vi.fn(),
    };
    messageEntriesQuery.eq.mockReturnValue(messageEntriesQuery);
    messageEntriesQuery.order.mockResolvedValue({
      data: [
        {
          id: "message-1",
          body: "Private to selected participant",
          revealed: false,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_id: "channel-1",
          message_channels: {
            title: "Leadership feedback",
            organization_id: "org-1",
            reveal_audience_type: "participants",
            reveal_level_ids: [],
          },
        },
        {
          id: "message-2",
          body: "Visible to a level audience",
          revealed: false,
          created_at: "2026-05-28T00:00:00.000Z",
          channel_id: "channel-2",
          message_channels: {
            title: "General feedback",
            organization_id: "org-1",
            reveal_audience_type: "levels",
            reveal_level_ids: ["public"],
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
      data: [
        { channel_id: "channel-1", participant_id: "participant-1" },
        { channel_id: "channel-2", participant_id: "participant-2" },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "message_channels") {
        return {
          select: vi.fn((columns: string) =>
            columns === "reveal_audience_type"
              ? channelSupportProbe
              : createListQuery({ data: [], error: null }),
          ),
        };
      }

      if (table === "message_entries") {
        return {
          select: vi.fn(() => messageEntriesQuery),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return {
          select: vi.fn((columns: string) =>
            columns === "channel_id"
              ? revealParticipantSupportProbe
              : revealParticipantsQuery,
          ),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      listParticipantRoomPrivateMessages("org-1", "participant-1"),
    ).resolves.toEqual([
      {
        id: "message-1",
        body: "Private to selected participant",
        revealed: false,
        createdAt: "2026-05-28T00:00:00.000Z",
        channelId: "channel-1",
        channelTitle: "Leadership feedback",
        revealAudienceType: "participants",
        revealLevelIds: [],
        revealParticipantIds: ["participant-1"],
      },
    ]);
  });

  it("falls back to the legacy channel schema when reveal audience columns are unavailable", async () => {
    const channelSupportProbe = createMaybeSingleQuery({
      data: null,
      error: { message: "column message_channels.reveal_audience_type does not exist" },
    });
    const listChannelsQuery = createListQuery({
      data: [
        {
          id: "channel-1",
          title: "General feedback",
          prompt: "Share anything that matters.",
          status: "open",
          submit_level_ids: ["public"],
          reveal_level_ids: [],
          created_at: "2026-05-28T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "message_channels") {
        return {
          select: vi.fn((columns: string) =>
            columns === "reveal_audience_type"
              ? channelSupportProbe
              : listChannelsQuery,
          ),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return {
          select: vi.fn(() =>
            createMaybeSingleQuery({
              data: null,
              error: { message: "relation does not exist" },
            }),
          ),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(listMessageChannels("org-1")).resolves.toEqual([
      {
        id: "channel-1",
        title: "General feedback",
        prompt: "Share anything that matters.",
        status: "open",
        reveal_audience_type: "levels",
        submit_level_ids: ["public"],
        reveal_level_ids: [],
        created_at: "2026-05-28T00:00:00.000Z",
      },
    ]);
  });

  it("loads participant reveal audiences into participant-room messages", async () => {
    const channelSupportProbe = createMaybeSingleQuery({
      data: { reveal_audience_type: "levels" },
      error: null,
    });
    const revealParticipantSupportProbe = createMaybeSingleQuery({
      data: null,
      error: null,
    });
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
      if (table === "message_channels") {
        return {
          select: vi.fn((columns: string) =>
            columns === "reveal_audience_type"
              ? channelSupportProbe
              : createListQuery({ data: [], error: null }),
          ),
        };
      }

      if (table === "message_entries") {
        return {
          select: vi.fn((columns: string) =>
            columns.includes("reveal_audience_type")
              ? messageEntriesQuery
              : messageEntriesQuery,
          ),
        };
      }

      if (table === "message_channel_reveal_participants") {
        return {
          select: vi.fn((columns: string) =>
            columns === "channel_id"
              ? revealParticipantSupportProbe
              : revealParticipantsQuery,
          ),
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
