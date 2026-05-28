import { canAccessAudience } from "@/lib/feedback/policy";
import type { ParticipantRoomVote, VoteStatus } from "@/lib/feedback/types";

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

type ParticipantVoteBallotRow = {
  vote_id: string;
  participant_id: string;
  choice: VoteChoice;
};

type ParticipantRoomVoteRow = {
  id: string;
  title: string;
  description: string;
  tag: string;
  status: VoteStatus;
  eligible_level_ids: string[];
  live_result_level_ids: string[];
  final_result_level_ids: string[];
};

type ParticipantVoteAccessRow = {
  id: string;
  organization_id: string;
  status: VoteStatus;
  eligible_level_ids: string[];
};

export type ParticipantRoomVoteRecord = ParticipantRoomVote & {
  description: string;
  tag: string;
  supportCount: number;
  opposeCount: number;
  totalCount: number;
  participantChoice: VoteChoice | null;
};

type CastParticipantVoteInput = {
  organizationId: string;
  participantId: string;
  participantLevelIds: string[];
  voteId: string;
  choice: VoteChoice;
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

export async function listParticipantRoomVotes(
  organizationId: string,
  participantId: string,
) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data: voteData, error: voteError } = await supabase
    .from("votes")
    .select(
      "id,title,description,tag,status,eligible_level_ids,live_result_level_ids,final_result_level_ids,created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (voteError) {
    throw new Error(
      `Failed to load participant room votes: ${voteError.message}`,
    );
  }

  const votes = (voteData ?? []) as ParticipantRoomVoteRow[];

  if (votes.length === 0) {
    return [];
  }

  const voteIds = votes.map(({ id }) => id);
  const { data: ballotData, error: ballotError } = await supabase
    .from("vote_ballots")
    .select("vote_id,participant_id,choice")
    .eq("organization_id", organizationId)
    .in("vote_id", voteIds);

  if (ballotError) {
    throw new Error(
      `Failed to load participant room vote ballots: ${ballotError.message}`,
    );
  }

  const ballotsByVoteId = new Map<string, ParticipantVoteBallotRow[]>();

  for (const ballot of (ballotData ?? []) as ParticipantVoteBallotRow[]) {
    const ballots = ballotsByVoteId.get(ballot.vote_id) ?? [];
    ballots.push(ballot);
    ballotsByVoteId.set(ballot.vote_id, ballots);
  }

  return votes.map((vote) => {
    const ballots = ballotsByVoteId.get(vote.id) ?? [];
    const supportCount = ballots.filter(
      (ballot) => ballot.choice === "support",
    ).length;
    const opposeCount = ballots.filter(
      (ballot) => ballot.choice === "oppose",
    ).length;

    return {
      id: vote.id,
      title: vote.title,
      description: vote.description,
      tag: vote.tag,
      status: vote.status,
      eligibleLevelIds: vote.eligible_level_ids ?? [],
      liveResultLevelIds: vote.live_result_level_ids ?? [],
      finalResultLevelIds: vote.final_result_level_ids ?? [],
      supportCount,
      opposeCount,
      totalCount: supportCount + opposeCount,
      participantChoice:
        ballots.find((ballot) => ballot.participant_id === participantId)?.choice ??
        null,
    } satisfies ParticipantRoomVoteRecord;
  });
}

export async function castParticipantVote({
  organizationId,
  participantId,
  participantLevelIds,
  voteId,
  choice,
}: CastParticipantVoteInput) {
  const trimmedVoteId = voteId.trim();

  if (!trimmedVoteId) {
    throw new Error("Vote id is required.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id,organization_id,status,eligible_level_ids")
    .eq("id", trimmedVoteId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load vote: ${error.message}`);
  }

  const vote = data as ParticipantVoteAccessRow | null;

  if (!vote || vote.organization_id !== organizationId) {
    throw new Error("Vote not found for this room.");
  }

  if (vote.status !== "active") {
    throw new Error("This vote is not open right now.");
  }

  if (!canAccessAudience(participantLevelIds, vote.eligible_level_ids ?? [])) {
    throw new Error("You do not have access to vote on this item.");
  }

  return upsertVoteBallot({
    voteId: trimmedVoteId,
    participantId,
    choice,
  });
}

export default countVoteChoices;
