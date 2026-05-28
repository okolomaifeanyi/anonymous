import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParticipantAccessForm from "@/components/participant-access-form";

vi.mock("@/app/room/[code]/actions", () => ({
  verifyParticipant: vi.fn(),
}));

vi.mock("@/components/ui/submit-button", () => ({
  default: ({ label }: { label: string }) => <button type="submit">{label}</button>,
}));

describe("ParticipantAccessForm", () => {
  it("allows 8-digit verification codes", () => {
    render(
      <ParticipantAccessForm
        code="pulse"
        organizationName="Team Pulse"
        identifierLabel="Email address"
        identifierType="email"
        identifierValue="user@example.com"
        verificationStep
        error={null}
        status={null}
      />,
    );

    expect(screen.getByLabelText("Code")).toHaveAttribute("maxLength", "8");
  });
});
