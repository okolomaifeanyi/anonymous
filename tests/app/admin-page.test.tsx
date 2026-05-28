import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/(protected)/admin/page";

vi.mock("@/lib/feedback/organizations", () => ({
  listOwnedOrganizations: vi.fn(async () => [
    {
      id: "org-1",
      name: "Pulse Team",
      code: "pulse-team",
      created_at: "2026-05-28T08:00:00.000Z",
      participant_identifier_label: "Email address",
    },
  ]),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminPage", () => {
  it("lists owned organizations after sign-in", async () => {
    render(await AdminPage());

    expect(
      screen.getByRole("heading", { name: "Your organizations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pulse Team")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open workspace" }),
    ).toHaveAttribute("href", "/admin/org/pulse-team");
  });
});
