import { describe, expect, it } from "vitest";

import filterRevealedMessages from "@/lib/feedback/messages";
import countVoteChoices from "@/lib/feedback/votes";

describe("feedback vote and message helpers", () => {
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
});
