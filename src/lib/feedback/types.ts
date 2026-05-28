export type IdentifierType = "email" | "phone" | "social" | "custom";

export type ParticipantStatus = "active" | "disabled";

export type VoteStatus = "draft" | "active" | "closed";

export type MessageChannelStatus = "draft" | "open" | "closed";

export type MessageChannelRevealAudienceType = "levels" | "participants";

export type VoteVisibilityRule = {
  status: VoteStatus;
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
};

export type ParticipantRoomVote = {
  id: string;
  title: string;
  status: VoteStatus;
  eligibleLevelIds: string[];
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
};

export type ParticipantRoomMessageChannel = {
  id: string;
  title: string;
  status: MessageChannelStatus;
  submitLevelIds: string[];
  revealLevelIds: string[];
};
