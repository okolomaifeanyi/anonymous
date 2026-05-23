import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/server";
import filterRevealedMessages, {
  revealMessageEntry,
} from "@/lib/feedback/messages";
import countVoteChoices, { upsertVoteBallot } from "@/lib/feedback/votes";

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
    channel_id: string;
    participant_id: string;
    body: string;
    revealed: boolean;
    created_at: string;
  } | null;
  error: { message: string } | null;
}) {
  return {
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
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

  it("revealMessageEntry returns the updated row when the update succeeds", async () => {
    const messageRow = {
      id: "message-1",
      channel_id: "channel-1",
      participant_id: "participant-1",
      body: "Visible",
      revealed: true,
      created_at: "2026-05-23T00:00:00.000Z",
    };
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
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

    await expect(revealMessageEntry("message-1", true)).resolves.toEqual(
      messageRow,
    );
  });

  it("revealMessageEntry throws on update error", async () => {
    const from = vi.fn((table: string) => {
      if (table === "message_entries") {
        return {
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

    await expect(revealMessageEntry("message-1", false)).rejects.toThrow(
      "Failed to update message entry reveal state: write failed",
    );
  });
});
