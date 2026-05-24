import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("home page", () => {
  it("shows admin and participant entry actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: "Admin sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter room" })).toBeInTheDocument();
  });
});
