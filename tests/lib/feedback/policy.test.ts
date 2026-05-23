import { describe, expect, it } from "vitest";

import {
  canAccessAudience,
  canSeeVoteResults,
  getVisibleParticipantRoomSections,
} from "@/lib/feedback/policy";

describe("feedback audience policy", () => {
  it("canAccessAudience allows access when at least one required level matches", () => {
    const participant = { levelIds: ["public", "executive"] };

    expect(canAccessAudience(participant.levelIds, ["executive"])).toBe(true);
    expect(canAccessAudience(participant.levelIds, ["chapter"])).toBe(false);
    expect(canAccessAudience([], [])).toBe(false);
  });

  it("canSeeVoteResults hides vote results from unauthorized viewers", () => {
    const participant = { levelIds: ["public", "executive"] };

    expect(
      canSeeVoteResults(participant.levelIds, {
        status: "active",
        liveResultLevelIds: ["executive"],
        finalResultLevelIds: ["public"],
      }),
    ).toBe(true);
    expect(
      canSeeVoteResults(["public"], {
        status: "active",
        liveResultLevelIds: ["executive"],
        finalResultLevelIds: ["executive"],
      }),
    ).toBe(false);
    expect(
      canSeeVoteResults(["public"], {
        status: "closed",
        liveResultLevelIds: ["executive"],
        finalResultLevelIds: ["public"],
      }),
    ).toBe(true);
  });

  it("getVisibleParticipantRoomSections builds a participant room model from eligible items only", () => {
    const room = getVisibleParticipantRoomSections({
      participantLevelIds: ["public"],
      votes: [
        {
          id: "vote-1",
          title: "Budget review",
          status: "active",
          eligibleLevelIds: ["public"],
          liveResultLevelIds: ["public"],
          finalResultLevelIds: ["public"],
        },
        {
          id: "vote-2",
          title: "Executive decision",
          status: "active",
          eligibleLevelIds: ["executive"],
          liveResultLevelIds: ["executive"],
          finalResultLevelIds: ["executive"],
        },
      ],
      messageChannels: [
        {
          id: "msg-1",
          title: "Rumours",
          status: "open",
          submitLevelIds: ["public"],
          revealLevelIds: [],
        },
        {
          id: "msg-2",
          title: "Leadership notes",
          status: "open",
          submitLevelIds: ["executive"],
          revealLevelIds: [],
        },
      ],
    });

    expect(room.votes).toHaveLength(1);
    expect(room.votes.map((vote) => vote.id)).toEqual(["vote-1"]);
    expect(room.messageChannels).toHaveLength(1);
    expect(room.messageChannels.map((channel) => channel.id)).toEqual(["msg-1"]);
    expect(room.resultsVisible).toBe(true);
  });
});
