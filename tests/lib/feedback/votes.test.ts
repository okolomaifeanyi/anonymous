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
