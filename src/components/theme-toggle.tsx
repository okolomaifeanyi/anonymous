"use client";

import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";

const themes = ["system", "light", "dark"] as const;
type Theme = (typeof themes)[number];

const icons: Record<Theme, typeof SunIcon> = {
  system: ComputerDesktopIcon,
  light: SunIcon,
  dark: MoonIcon,
};

const labels: Record<Theme, string> = {
  system: "Switch to light theme",
  light: "Switch to dark theme",
  dark: "Switch to system theme",
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (theme as Theme) ?? "system";
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  const Icon = icons[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={labels[current]}
      className="inline-flex items-center justify-center rounded-full border border-border bg-background/50 p-1.5 text-muted-foreground transition hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
