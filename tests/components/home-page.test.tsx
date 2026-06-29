import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
    resolvedTheme: "dark",
  }),
}));

describe("home page", () => {
  it("shows admin and participant entry actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /Admin sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Enter room/i }),
    ).toBeInTheDocument();
  });
});
