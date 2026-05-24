import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminOrganizationLayout from "@/app/(protected)/admin/org/[code]/layout";

vi.mock("@/lib/feedback/organizations", () => ({
  requireOwnedOrganization: vi.fn(async () => ({
    id: "org-1",
    name: "Pulse Labs",
    code: "pulse",
    owner_id: "user-1",
    participant_identifier_type: "email",
    participant_identifier_label: "Email",
  })),
}));

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

describe("AdminOrganizationLayout", () => {
  it("wraps nested pages in the admin shell and org navigation", async () => {
    render(
      await AdminOrganizationLayout({
        children: <div>Overview body</div>,
        params: Promise.resolve({ code: "pulse" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Pulse Labs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", {
        name: "Organization admin navigation",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Overview body")).toBeInTheDocument();
  });
});
