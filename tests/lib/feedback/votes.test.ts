import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/server";
import filterRevealedMessages, {
  revealMessageEntry,
} from "@/lib/feedback/messages";
import countVoteChoices, {
  parseVoteInput,
  listParticipantRoomVotes,
  upsertVoteBallot,
} from "@/lib/feedback/votes";

function createSelectQuery(result: {
  data: { organization_id: string } | null;
  error: { message: string } | null;
}) {
  return {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function createUpsertQuery(result: {
  data: {
    vote_id: string;
    participant_id: string;
    choice: "support" | "oppose";
    created_at: string;
  } | null;
  error: { message: string } | null;
}) {
  return {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function createUpdateQuery(result: {
  data: {
    id: string;
    organization_id?: string;
    channel_id: string;
    participant_id: string;
    body: string;
    revealed: boolean;
    created_at: string;
  } | null;
  error: { message: string } | null;
}) {
  const query = {
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
  };
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
}

describe("feedback vote and message helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("countVoteChoices summarizes support, oppose, and total ballots", () => {
    expect(
      countVoteChoices([
        { choice: "support" },
        { choice: "support" },
        { choice: "oppose" },
      ]),
    ).toEqual({
      support: 2,
      oppose: 1,
      total: 3,
    });
  });

  it("parseVoteInput rejects blank vote titles", () => {
    expect(() =>
      parseVoteInput({
        title: "   ",
        description: "Discuss the proposal",
        tag: "General",
        eligibleLevelIds: ["level-1"],
        liveResultLevelIds: ["level-1"],
        finalResultLevelIds: ["level-1"],
      }),
    ).toThrow("Vote title is required.");
  });

  it("parseVoteInput requires at least one eligible level", () => {
    expect(() =>
      parseVoteInput({
        title: "Approve the budget",
        description: "Discuss the proposal",
        tag: "General",
        eligibleLevelIds: [],
        liveResultLevelIds: ["level-1"],
        finalResultLevelIds: ["level-1"],
      }),
    ).toThrow("At least one eligible level is required.");
  });

  it("parseVoteInput trims fields, defaults the tag, and deduplicates level ids", () => {
    expect(
      parseVoteInput({
        title: "  Approve the budget  ",
        description: "  Discuss the proposal  ",
        tag: "   ",
        eligibleLevelIds: [" level-1 ", "level-2", "level-1", ""],
        liveResultLevelIds: [" level-2 ", "level-2", ""],
        finalResultLevelIds: [" level-3 ", "", "level-3"],
      }),
    ).toEqual({
      title: "Approve the budget",
      description: "Discuss the proposal",
      tag: "General",
      eligibleLevelIds: ["level-1", "level-2"],
      liveResultLevelIds: ["level-2"],
      finalResultLevelIds: ["level-3"],
    });
  });

  it("listParticipantRoomVotes loads ballots without an embedded relation", async () => {
    const voteSelects: string[] = [];
    const ballotSelects: string[] = [];
    const votesQuery = {
      eq: vi.fn(),
      order: vi.fn(),
    };
    votesQuery.eq.mockReturnValue(votesQuery);
    votesQuery.order.mockResolvedValue({
      data: [
        {
          id: "vote-1",
          title: "Approve the budget",
          description: "Budget proposal",
          tag: "General",
          status: "active",
          eligible_level_ids: ["level-1"],
          live_result_level_ids: ["level-1"],
          final_result_level_ids: ["level-1"],
          created_at: "2026-05-28T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const ballotsQuery = {
      eq: vi.fn(),
      in: vi.fn(),
    };
    ballotsQuery.eq.mockReturnValue(ballotsQuery);
    ballotsQuery.in.mockResolvedValue({
      data: [
        {
          vote_id: "vote-1",
          participant_id: "participant-1",
          choice: "support",
        },
        {
          vote_id: "vote-1",
          participant_id: "participant-2",
          choice: "oppose",
        },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "votes") {
        return {
          select: vi.fn((columns: string) => {
            voteSelects.push(columns);
            return votesQuery;
          }),
        };
      }

      if (table === "vote_ballots") {
        return {
          select: vi.fn((columns: string) => {
            ballotSelects.push(columns);
            return ballotsQuery;
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      listParticipantRoomVotes("org-1", "participant-1"),
    ).resolves.toEqual([
      {
        id: "vote-1",
        title: "Approve the budget",
        description: "Budget proposal",
        tag: "General",
        status: "active",
        eligibleLevelIds: ["level-1"],
        liveResultLevelIds: ["level-1"],
        finalResultLevelIds: ["level-1"],
        supportCount: 1,
        opposeCount: 1,
        totalCount: 2,
        participantChoice: "support",
      },
    ]);

    expect(voteSelects[0]).not.toContain("vote_ballots(");
    expect(ballotSelects[0]).toBe("vote_id,participant_id,choice");
  });

  it("filterRevealedMessages returns only revealed messages", () => {
    expect(
      filterRevealedMessages([
        { id: "a", revealed: true, body: "Visible" },
        { id: "b", revealed: false, body: "Hidden" },
      ]),
    ).toEqual([{ id: "a", revealed: true, body: "Visible" }]);
  });

  it("upsertVoteBallot returns the selected row when the write succeeds", async () => {
    const voteQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const participantQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const ballotRow = {
      vote_id: "vote-1",
      participant_id: "participant-1",
      choice: "support" as const,
      created_at: "2026-05-23T00:00:00.000Z",
    };
    const upsertQuery = createUpsertQuery({
      data: ballotRow,
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "votes") {
        return {
          select: vi.fn().mockReturnValue(voteQuery),
        };
      }

      if (table === "organization_participants") {
        return {
          select: vi.fn().mockReturnValue(participantQuery),
        };
      }

      if (table === "vote_ballots") {
        return {
          upsert: vi.fn().mockReturnValue(upsertQuery),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      upsertVoteBallot({
        voteId: "vote-1",
        participantId: "participant-1",
        choice: "support",
      }),
    ).resolves.toEqual(ballotRow);
  });

  it("upsertVoteBallot throws when vote and participant organizations do not match", async () => {
    const voteQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const participantQuery = createSelectQuery({
      data: { organization_id: "org-2" },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "votes") {
        return {
          select: vi.fn().mockReturnValue(voteQuery),
        };
      }

      if (table === "organization_participants") {
        return {
          select: vi.fn().mockReturnValue(participantQuery),
        };
      }

      if (table === "vote_ballots") {
        return {
          upsert: vi.fn(),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      upsertVoteBallot({
        voteId: "vote-1",
        participantId: "participant-1",
        choice: "oppose",
      }),
    ).rejects.toThrow(
      "Vote and participant must belong to the same organization.",
    );
  });

  it("upsertVoteBallot throws on write error after organization validation succeeds", async () => {
    const voteQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const participantQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const upsertQuery = createUpsertQuery({
      data: null,
      error: { message: "write failed" },
    });
    const from = vi.fn((table: string) => {
      if (table === "votes") {
        return {
          select: vi.fn().mockReturnValue(voteQuery),
        };
      }

      if (table === "organization_participants") {
        return {
          select: vi.fn().mockReturnValue(participantQuery),
        };
      }

      if (table === "vote_ballots") {
        return {
          upsert: vi.fn().mockReturnValue(upsertQuery),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      upsertVoteBallot({
        voteId: "vote-1",
        participantId: "participant-1",
        choice: "support",
      }),
    ).rejects.toThrow("Failed to upsert vote ballot: write failed");
  });

  it("revealMessageEntry returns the updated row when the message belongs to the expected organization", async () => {
    const messageQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const messageRow = {
      id: "message-1",
      organization_id: "org-1",
      channel_id: "channel-1",
      participant_id: "participant-1",
      body: "Visible",
      revealed: true,
      created_at: "2026-05-23T00:00:00.000Z",
    };
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
          select: vi.fn().mockReturnValue(messageQuery),
          update: vi.fn().mockReturnValue(
            createUpdateQuery({
              data: messageRow,
              error: null,
            }),
          ),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      revealMessageEntry({
        id: "message-1",
        organizationId: "org-1",
        revealed: true,
      }),
    ).resolves.toEqual(messageRow);
  });

  it("revealMessageEntry throws when the message organization does not match", async () => {
    const messageQuery = createSelectQuery({
      data: { organization_id: "org-2" },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
          select: vi.fn().mockReturnValue(messageQuery),
          update: vi.fn(),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      revealMessageEntry({
        id: "message-1",
        organizationId: "org-1",
        revealed: true,
      }),
    ).rejects.toThrow("Message entry must belong to the expected organization.");
  });

  it("revealMessageEntry throws on update error", async () => {
    const messageQuery = createSelectQuery({
      data: { organization_id: "org-1" },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
          select: vi.fn().mockReturnValue(messageQuery),
          update: vi.fn().mockReturnValue(
            createUpdateQuery({
              data: null,
              error: { message: "write failed" },
            }),
          ),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      revealMessageEntry({
        id: "message-1",
        organizationId: "org-1",
        revealed: false,
      }),
    ).rejects.toThrow("Failed to update message entry reveal state: write failed");
  });
});
