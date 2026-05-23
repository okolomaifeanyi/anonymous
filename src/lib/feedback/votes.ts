export type VoteChoice = "support" | "oppose";

type VoteBallot = {
  choice: VoteChoice;
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

export async function upsertVoteBallot({
  voteId,
  participantId,
  choice,
}: UpsertVoteBallotInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vote_ballots")
    .upsert(
      {
        vote_id: voteId,
        participant_id: participantId,
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
