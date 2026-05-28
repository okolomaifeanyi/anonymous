import type {
  MessageChannelRevealAudienceType,
  ParticipantRoomMessageChannel,
  ParticipantRoomVote,
  VoteVisibilityRule,
} from "@/lib/feedback/types";

type RevealedMessageVisibilityRule = {
  revealAudienceType: MessageChannelRevealAudienceType;
  revealLevelIds: string[];
  revealParticipantIds: string[];
};

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

export function canSeeRevealedMessages(
  participantId: string,
  participantLevelIds: string[],
  message: RevealedMessageVisibilityRule,
) {
  if (message.revealAudienceType === "participants") {
    return message.revealParticipantIds.includes(participantId);
  }

  return canAccessAudience(participantLevelIds, message.revealLevelIds);
}

type ParticipantRoomSectionsInput<
  TVote extends ParticipantRoomVote,
  TMessageChannel extends ParticipantRoomMessageChannel,
> = {
  participantLevelIds: string[];
  votes: TVote[];
  messageChannels: TMessageChannel[];
};

type ParticipantRoomSections<
  TVote extends ParticipantRoomVote,
  TMessageChannel extends ParticipantRoomMessageChannel,
> = {
  votes: TVote[];
  messageChannels: TMessageChannel[];
  resultsVisible: boolean;
};

type ParticipantRoomAccessSummaryInput<
  TVote extends ParticipantRoomVote,
  TMessageChannel extends ParticipantRoomMessageChannel,
> = {
  participantId: string;
  participantLevelIds: string[];
  votes: TVote[];
  messageChannels: TMessageChannel[];
  revealedMessages: RevealedMessageVisibilityRule[];
};

export type ParticipantRoomAccessSummary = {
  voteCount: number;
  messageChannelCount: number;
  resultCount: number;
  revealedMessageCount: number;
};

export function getVisibleParticipantRoomSections<
  TVote extends ParticipantRoomVote,
  TMessageChannel extends ParticipantRoomMessageChannel,
>(
  input: ParticipantRoomSectionsInput<TVote, TMessageChannel>,
): ParticipantRoomSections<TVote, TMessageChannel> {
  const votes = input.votes.filter((vote) =>
    vote.status !== "draft" &&
    canAccessAudience(input.participantLevelIds, vote.eligibleLevelIds),
  );
  const messageChannels = input.messageChannels.filter((channel) =>
    channel.status !== "draft" &&
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

export function getParticipantRoomAccessSummary(
  input: ParticipantRoomAccessSummaryInput<
    ParticipantRoomVote,
    ParticipantRoomMessageChannel
  >,
): ParticipantRoomAccessSummary {
  return {
    voteCount: input.votes.length,
    messageChannelCount: input.messageChannels.length,
    resultCount: input.votes.filter((vote) =>
      canSeeVoteResults(input.participantLevelIds, vote),
    ).length,
    revealedMessageCount: input.revealedMessages.filter((message) =>
      canSeeRevealedMessages(input.participantId, input.participantLevelIds, message),
    ).length,
  };
}
