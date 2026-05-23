export type VoteChoice = "support" | "oppose";

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

export default countVoteChoices;
