import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OrgAdminNav from "@/components/org-admin-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/org/pulse",
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

describe("OrgAdminNav", () => {
  it("renders the organization admin navigation links", () => {
    render(<OrgAdminNav code="pulse" />);

    expect(
      screen.getByRole("link", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Participants" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Levels" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Votes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messages" })).toBeInTheDocument();
  });
});
