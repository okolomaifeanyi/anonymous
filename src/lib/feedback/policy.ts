import type {
  ParticipantRoomMessageChannel,
  ParticipantRoomVote,
  VoteVisibilityRule,
} from "@/lib/feedback/types";

export function canAccessAudience(
  participantLevelIds: string[],
  audienceLevelIds: string[],
): boolean {
  if (audienceLevelIds.length === 0) {
    return false;
  }

  return audienceLevelIds.some((levelId) => participantLevelIds.includes(levelId));
}

export function canSeeVoteResults(
  participantLevelIds: string[],
  vote: VoteVisibilityRule,
): boolean {
  const audienceLevelIds =
    vote.status === "closed" ? vote.finalResultLevelIds : vote.liveResultLevelIds;

  return canAccessAudience(participantLevelIds, audienceLevelIds);
}

type ParticipantRoomSectionsInput = {
  participantLevelIds: string[];
  votes: ParticipantRoomVote[];
  messageChannels: ParticipantRoomMessageChannel[];
};

type ParticipantRoomSections = {
  votes: ParticipantRoomVote[];
  messageChannels: ParticipantRoomMessageChannel[];
  resultsVisible: boolean;
};

export function getVisibleParticipantRoomSections(
  input: ParticipantRoomSectionsInput,
): ParticipantRoomSections {
  const votes = input.votes.filter((vote) =>
    canAccessAudience(input.participantLevelIds, vote.eligibleLevelIds),
  );
  const messageChannels = input.messageChannels.filter((channel) =>
    canAccessAudience(input.participantLevelIds, channel.submitLevelIds),
  );

  return {
    votes,
    messageChannels,
    resultsVisible: votes.some((vote) =>
      canSeeVoteResults(input.participantLevelIds, vote),
    ),
  };
}
