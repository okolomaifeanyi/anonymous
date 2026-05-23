import type { VoteStatus } from "@/lib/feedback/types";

export type VoteChoice = "support" | "oppose";

export type OrganizationVote = {
  id: string;
  title: string;
  description: string;
  tag: string;
  status: VoteStatus;
  eligible_level_ids: string[];
  live_result_level_ids: string[];
  final_result_level_ids: string[];
  created_at: string;
};

type VoteBallot = {
  choice: VoteChoice;
};

type OrganizationLookup = {
  organization_id: string;
};

type VoteAdminClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: OrganizationLookup | null;
          error: { message: string } | null;
        }>;
      };
    };
    upsert: (
      values: {
        vote_id: string;
        participant_id: string;
        organization_id: string;
        choice: VoteChoice;
      },
      options: {
        onConflict: string;
      },
    ) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: {
            vote_id: string;
            participant_id: string;
            choice: VoteChoice;
            created_at: string;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

type UpsertVoteBallotInput = {
  voteId: string;
  participantId: string;
  choice: VoteChoice;
};

type ParseVoteInput = {
  title: string;
  description: string;
  tag: string;
  eligibleLevelIds: string[];
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
};

type CreateVoteInput = ParseVoteInput & {
  organizationId: string;
  status: VoteStatus;
};

function normalizeLevelIds(levelIds: string[]) {
  return [...new Set(levelIds.map((value) => value.trim()).filter(Boolean))];
}

export function parseVoteInput(input: ParseVoteInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Vote title is required.");
  }

  const eligibleLevelIds = normalizeLevelIds(input.eligibleLevelIds);

  if (eligibleLevelIds.length === 0) {
    throw new Error("At least one eligible level is required.");
  }

  return {
    title,
    description: input.description.trim(),
    tag: input.tag.trim() || "General",
    eligibleLevelIds,
    liveResultLevelIds: normalizeLevelIds(input.liveResultLevelIds),
    finalResultLevelIds: normalizeLevelIds(input.finalResultLevelIds),
  };
}

export function countVoteChoices(ballots: VoteBallot[]) {
  return ballots.reduce(
    (totals, ballot) => {
      if (ballot.choice === "support") {
        totals.support += 1;
      }

      if (ballot.choice === "oppose") {
        totals.oppose += 1;
      }

      totals.total += 1;
      return totals;
    },
    { support: 0, oppose: 0, total: 0 },
  );
}

async function selectOrganizationId(
  supabase: VoteAdminClient,
  table: string,
  id: string,
  label: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("organization_id")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load ${label} organization: ${error.message}`);
  }

  if (!data) {
    throw new Error(`${label} not found.`);
  }

  return data.organization_id;
}

export async function upsertVoteBallot({
  voteId,
  participantId,
  choice,
}: UpsertVoteBallotInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient() as unknown as VoteAdminClient;
  const voteOrganizationId = await selectOrganizationId(
    supabase,
    "votes",
    voteId,
    "Vote",
  );
  const participantOrganizationId = await selectOrganizationId(
    supabase,
    "organization_participants",
    participantId,
    "Participant",
  );

  if (voteOrganizationId !== participantOrganizationId) {
    throw new Error("Vote and participant must belong to the same organization.");
  }

  const { data, error } = await supabase
    .from("vote_ballots")
    .upsert(
      {
        vote_id: voteId,
        participant_id: participantId,
        organization_id: voteOrganizationId,
        choice,
      },
      {
        onConflict: "vote_id,participant_id",
      },
    )
    .select("vote_id,participant_id,choice,created_at")
    .single();

  if (error) {
    throw new Error(`Failed to upsert vote ballot: ${error.message}`);
  }

  return data;
}

export async function createVote(input: CreateVoteInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const vote = parseVoteInput(input);
  const { data, error } = await supabase
    .from("votes")
    .insert({
      organization_id: input.organizationId,
      title: vote.title,
      description: vote.description,
      tag: vote.tag,
      eligible_level_ids: vote.eligibleLevelIds,
      live_result_level_ids: vote.liveResultLevelIds,
      final_result_level_ids: vote.finalResultLevelIds,
      status: input.status,
    })
    .select(
      "id,title,description,tag,status,eligible_level_ids,live_result_level_ids,final_result_level_ids,created_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to create vote: ${error.message}`);
  }

  return data as OrganizationVote;
}

export async function listVotes(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select(
      "id,title,description,tag,status,eligible_level_ids,live_result_level_ids,final_result_level_ids,created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load votes: ${error.message}`);
  }

  return (data ?? []) as OrganizationVote[];
}

export default countVoteChoices;
