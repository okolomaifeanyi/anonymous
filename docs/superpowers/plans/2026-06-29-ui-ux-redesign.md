# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a clear three-level visual hierarchy (page / section container / item card), add light/dark/system theming via `next-themes`, and fix four compounding bugs (global button override, copy-pasted orb divs, missing label association, non-monospace OTP input).

**Architecture:** Install `next-themes` and wrap the root layout in a client-side `Providers` component. Introduce two new CSS custom properties (`--app-surface`, `--app-card`) that resolve to appropriate values in light and dark mode. Replace every hardcoded dark colour (`#0f141d`, `#0b1018`, `text-white/*`, `bg-white/5`) with semantic tokens across all components. Move the dark-only body texture into an `html.dark body` block so light mode gets a plain white background.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, `next-themes` (to install), Heroicons v2, Vitest + React Testing Library.

## Global Constraints

- No routing, data-fetching, or server-action changes — style and layout only.
- No new dependencies beyond `next-themes`.
- All hardcoded colours listed in the Colour Replacement Reference must be replaced with the semantic token shown.
- All existing Vitest tests must pass after every task.
- Do not remove any card elements — the card structure stays; only visual treatment and hierarchy change.

## Colour Replacement Reference

Every occurrence of these values must be replaced:

| Old value | Replacement |
|---|---|
| `bg-[#0f141d]` | `bg-[var(--app-surface)]` |
| `bg-[#0b1018]` | `bg-[var(--app-card)]` |
| `bg-[#101722]/95` | `bg-[var(--app-surface)]/95` |
| `bg-[#0b0f15]` | `bg-background` |
| `text-[#0b0f15]` | `text-background` |
| `bg-white/5` | `bg-muted/50` |
| `bg-white/10` | `bg-muted` |
| `border-white/10` | `border-border` |
| `border-white/15` | `border-border` |
| `border-white/20` | `border-border` |
| `border-white/25` | `border-border/60` |
| `text-white` (not `text-white/XX`) | `text-foreground` |
| `text-white/85` | `text-foreground/85` |
| `text-white/80` | `text-foreground/80` |
| `text-white/70` | `text-foreground/70` |
| `text-white/65` | `text-muted-foreground` |
| `text-white/60` | `text-muted-foreground` |
| `text-white/55` | `text-muted-foreground` |
| `text-white/50` | `text-muted-foreground/80` |
| `text-white/45` | `text-muted-foreground/70` |
| `text-white/40` | `text-muted-foreground/60` |

Additionally, for buttons in `participant-room.tsx` that rely on light-coloured text in dark mode, add a `dark:` companion:
- `text-emerald-100` → `text-emerald-700 dark:text-emerald-100`
- `text-rose-100` → `text-rose-700 dark:text-rose-100`
- Leave buttons using `text-white` in `rounded-full border` pill style → `text-foreground`

---

### Task 1: Install next-themes and wire up ThemeProvider

**Files:**
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `<Providers>` — client wrapper used in `layout.tsx`

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

Expected: package.json gains `"next-themes": "^x.x.x"` in dependencies.

- [ ] **Step 2: Create `src/components/providers.tsx`**

```tsx
"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

Replace the current file with:

```tsx
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

import Providers from "@/components/providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anonymous Feedback",
  description:
    "Verified participant access for anonymous messages and controlled voting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${fraunces.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run tests to confirm nothing is broken**

```bash
npm test
```

Expected: all existing tests pass (they don't render layout.tsx).

- [ ] **Step 5: Commit**

```bash
git add src/components/providers.tsx src/app/layout.tsx package.json package-lock.json
git commit -m "Add next-themes ThemeProvider"
```

---

### Task 2: Fix globals.css — button scope, CSS tokens, body background

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `--app-surface` and `--app-card` CSS custom properties available in all components; `.button-surface` retains dark-navy style; plain `button` elements no longer overridden.

- [ ] **Step 1: Scope the button rule**

In `src/app/globals.css`, find the first `@layer base` block (lines 149–187). Replace the `:where(button, [data-slot="button"], .button-surface)` selector and its companion hover/active rules with:

```css
@layer base {
  :where(.button-surface) {
    background-color: var(--button-surface) !important;
    background-image: none !important;
    background-clip: padding-box;
    color: var(--button-foreground) !important;
    border-color: var(--button-border) !important;
    box-shadow: var(--button-shadow);
    border-radius: 0.5rem !important;
    text-shadow: none;
  }

  :where(.button-surface):not(:disabled):hover {
    filter: brightness(1.02);
  }

  :where(.button-surface):not(:disabled):active {
    transform: translateY(1px);
  }

  :where(.button-surface-admin) {
    background-color: #20382f !important;
    color: #f8fafc !important;
    border-color: rgb(255 255 255 / 0.08) !important;
    box-shadow:
      0 4px 0 rgb(18 51 43 / 0.6),
      0 12px 26px rgb(18 51 43 / 0.18),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
  }

  :where(.button-surface-admin):not(:disabled):hover {
    filter: brightness(1.02);
  }

  :where(.button-surface-admin):not(:disabled):active {
    transform: translateY(1px);
  }
}
```

- [ ] **Step 2: Add `--app-surface` and `--app-card` to `:root` and `.dark`**

In the `:root` block, append after the last existing variable (`--sidebar-ring`):

```css
  --app-surface: #f0f2f5;
  --app-card: #ffffff;
```

In the `.dark` block, append after `--sidebar-ring`:

```css
  --app-surface: #0f141d;
  --app-card: #0b1018;
```

- [ ] **Step 3: Fix body background — dark texture only in dark mode**

In the second `@layer base` block, replace:

```css
  body {
    @apply bg-background text-foreground;
    background-color: #0b0f15;
    background-image:
      linear-gradient(rgba(11, 15, 21, 0.92), rgba(11, 15, 21, 0.92)),
      var(--button-texture);
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
  }
```

with:

```css
  body {
    @apply bg-background text-foreground;
  }

  html.dark body {
    background-color: #0b0f15;
    background-image:
      linear-gradient(rgba(11, 15, 21, 0.92), rgba(11, 15, 21, 0.92)),
      var(--button-texture);
    background-attachment: fixed;
    background-position: center;
    background-size: cover;
  }
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "Fix globals.css: scope button override, add surface/card tokens, light-mode body"
```

---

### Task 3: Create BackgroundOrbs component

**Files:**
- Create: `src/components/background-orbs.tsx`

**Interfaces:**
- Produces: `<BackgroundOrbs variant="default" | "minimal" />` — renders the decorative blur circles with reduced opacity in light mode.

- [ ] **Step 1: Create `src/components/background-orbs.tsx`**

```tsx
type BackgroundOrbsProps = {
  variant?: "default" | "minimal";
};

export default function BackgroundOrbs({
  variant = "default",
}: BackgroundOrbsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] opacity-30 dark:opacity-100" />
      <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px] opacity-30 dark:opacity-100" />
      {variant === "default" ? (
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px] opacity-30 dark:opacity-100" />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/background-orbs.tsx
git commit -m "Add BackgroundOrbs component"
```

---

### Task 4: Create ThemeToggle and update Breadcrumbs

**Files:**
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/components/breadcrumbs.tsx`
- Modify: `tests/components/home-page.test.tsx`

**Interfaces:**
- Consumes: `useTheme` from `next-themes`, Heroicons `ComputerDesktopIcon`, `SunIcon`, `MoonIcon`
- Produces: `<ThemeToggle />` — cycles system → light → dark on click; placed in Breadcrumbs.

- [ ] **Step 1: Create `src/components/theme-toggle.tsx`**

```tsx
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
```

- [ ] **Step 2: Update `src/components/breadcrumbs.tsx`**

Replace the file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  admin: "Admin",
  login: "Admin sign in",
  org: "Organization",
  participants: "Participants",
  levels: "Levels",
  votes: "Votes",
  room: "Room",
  space: "Space",
  messages: "Messages",
  new: "New",
};

function toLabel(segment: string) {
  if (labelMap[segment]) return labelMap[segment];
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function isLinkableCrumb(segments: string[], index: number) {
  const href = `/${segments.slice(0, index + 1).join("/")}`;
  const first = segments[0];

  if (href === "/admin") return true;
  if (first === "auth") return href === "/auth/login";

  if (first === "admin") {
    if (segments[1] !== "org") return false;
    if (href === "/admin/org/new") return true;
    if (index >= 2 && segments[2] !== "new") return true;
    return false;
  }

  if (first === "room") return index >= 1;
  if (first === "org") return index >= 1;

  return index === 0;
}

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments
    .map((segment, index) => {
      if (segments[0] === "auth" && index === 0) return null;
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        href,
        label: toLabel(segment),
        linkable: isLinkableCrumb(segments, index),
      };
    })
    .filter((crumb): crumb is NonNullable<typeof crumb> => Boolean(crumb));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition hover:text-foreground"
      >
        <HomeIcon className="h-3.5 w-3.5" />
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-2">
          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
          {crumb.linkable ? (
            <Link
              href={crumb.href}
              className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground/60">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
      <span className="ml-auto">
        <ThemeToggle />
      </span>
    </nav>
  );
}
```

- [ ] **Step 3: Update `tests/components/home-page.test.tsx` to mock new dependencies**

Replace the file with:

```tsx
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
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass including the updated home-page test.

- [ ] **Step 5: Commit**

```bash
git add src/components/theme-toggle.tsx src/components/breadcrumbs.tsx tests/components/home-page.test.tsx
git commit -m "Add ThemeToggle, update Breadcrumbs with theme switcher and semantic tokens"
```

---

### Task 5: Update homepage, room entry page, and admin login page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/room/page.tsx`
- Modify: `src/app/auth/login/page.tsx`

**Interfaces:**
- Consumes: `<BackgroundOrbs />` replacing inline orb divs.

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10">
        <Breadcrumbs />

        <section className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Link
            href="/auth/login"
            className="button-surface button-surface-admin absolute right-0 top-0 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition sm:px-5 sm:py-2.5"
          >
            Admin sign in
          </Link>

          <div className="space-y-6 pt-10 lg:pt-0">
            <h1 className="font-heading text-4xl leading-tight md:text-5xl">
              Anonymous voting and feedback for organizations.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Admins manage the workspace. Participants join private rooms to
              vote and send feedback without exposing their identity.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground/80">
              <span className="inline-flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5 text-foreground/80" />
                Verified access
              </span>
              <span className="hidden h-4 w-px bg-border md:block" />
              <span className="inline-flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-foreground/80" />
                Private feedback rooms
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/room"
                className="button-surface group inline-flex items-center justify-center gap-3 px-7 py-4 text-base font-semibold transition hover:-translate-y-0.5 sm:px-8"
              >
                Enter room
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Admin-managed workspaces",
                description: "Create and manage each workspace from one place.",
                icon: ShieldCheckIcon,
              },
              {
                title: "Private participant rooms",
                description:
                  "People see only the votes and messages meant for them.",
                icon: LockClosedIcon,
              },
              {
                title: "Clear internal signals",
                description: "Collect feedback you can act on.",
                icon: CheckBadgeIcon,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-muted/50 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                    <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/app/room/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";

export default async function RoomEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const resolved = await searchParams;
  const code = resolved.code?.trim() ?? "";

  if (code) {
    redirect(`/room/${code}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="rounded-[2rem] border border-border bg-[var(--app-surface)] p-8">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl md:text-4xl">Enter room code</h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Use the code from your organizer.
            </p>
          </div>

          <form action="/room" method="get" className="mt-8 space-y-4">
            <label htmlFor="room-code" className="block text-sm text-muted-foreground">
              Room code
            </label>
            <input
              id="room-code"
              name="code"
              required
              className="w-full rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground focus:border-border/60 focus:outline-none"
            />
            <button
              type="submit"
              className="button-surface inline-flex items-center px-5 py-3 text-sm font-semibold transition"
            >
              Open room
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/auth/login/page.tsx`**

```tsx
import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";
import RateLimitBanner from "@/components/rate-limit-banner";

import { requestMagicLink } from "./actions";
import SubmitButton from "./submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    cooldown?: string;
    sent?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const resolved = await searchParams;
  const sent = resolved?.sent === "1";
  const errorMessage = resolved?.message?.trim() || null;
  const hasError = Boolean(resolved?.error || errorMessage);
  const parsedCooldown = Number.parseInt(resolved?.cooldown ?? "", 10);
  const initialCooldown =
    Number.isFinite(parsedCooldown) && parsedCooldown > 0 ? parsedCooldown : 0;
  const isRateLimited =
    resolved?.error === "supabase-auth" && initialCooldown > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            Admin access
          </div>
          <h1 className="font-heading text-3xl md:text-4xl">
            Sign in to open the admin shell
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            We&apos;ll send a secure magic link so you can manage organizations,
            review anonymous feedback, and control internal voting.
          </p>
        </header>

        <div className="rounded-3xl border border-border bg-[var(--app-surface)] p-8">
          <form action={requestMagicLink} className="space-y-5">
            <label
              htmlFor="email"
              className="block text-sm text-muted-foreground"
            >
              Email address
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3">
              <EnvelopeIcon className="h-5 w-5 text-muted-foreground/50" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-transparent text-sm text-foreground/90 focus:outline-none"
              />
            </div>
            <SubmitButton
              key={`${resolved?.sent ?? "0"}:${resolved?.error ?? "none"}:${initialCooldown}`}
              initialCooldown={initialCooldown}
            />
          </form>
          {sent && (
            <p className="mt-4 text-center text-xs text-emerald-600 dark:text-emerald-200">
              Magic link requested. Check your inbox and spam.
            </p>
          )}
          {hasError &&
            (isRateLimited ? (
              <RateLimitBanner
                className="mt-4 text-center text-xs text-rose-600 dark:text-rose-200"
                prefix="Email provider rate limit exceeded. Wait "
                suffix=" seconds and try again."
                initialSeconds={initialCooldown}
              />
            ) : (
              <p className="mt-4 text-center text-xs text-rose-600 dark:text-rose-200">
                {errorMessage ?? "Could not send magic link. Try again."}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/room/page.tsx src/app/auth/login/page.tsx
git commit -m "Update public pages: BackgroundOrbs, semantic tokens, login a11y fix"
```

---

### Task 6: Update participant access page and form component

**Files:**
- Modify: `src/app/room/[code]/page.tsx`
- Modify: `src/components/participant-access-form.tsx`

**Interfaces:**
- Consumes: `<BackgroundOrbs />`.

- [ ] **Step 1: Replace `src/app/room/[code]/page.tsx`**

```tsx
import { notFound, redirect } from "next/navigation";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";
import ParticipantAccessForm from "@/components/participant-access-form";
import RateLimitBanner from "@/components/rate-limit-banner";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import { getParticipantRoomContext } from "@/lib/feedback/participants";

type ParticipantAccessPageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getAccessErrorMessage(
  error: string | undefined,
  message: string | undefined,
  cooldown: string | undefined,
) {
  if (error === "identifier-required") return "Enter the approved identifier.";
  if (error === "access-denied") return "That email is not approved.";
  if (error === "code-required") return "Enter the code from your email.";
  if (error === "code-invalid") return "That code is invalid or expired. Request a new one.";

  if (error === "request-failed" || error === "verification-failed") {
    return message ?? "We could not complete verification. Try again.";
  }

  if (error === "rate-limited") {
    const parsedCooldown = Number.parseInt(cooldown ?? "", 10);
    if (Number.isFinite(parsedCooldown) && parsedCooldown > 0) {
      return message ?? `Email provider rate limit exceeded. Wait ${parsedCooldown} seconds and try again.`;
    }
    return message ?? "Email provider rate limit exceeded. Wait a minute and try again.";
  }

  return null;
}

function getAccessStatusMessage(status: string | undefined) {
  if (status === "signed-out") return "You left the room. Verify again to re-enter.";
  if (status === "code-sent") return "Code requested. Check your inbox and spam.";
  return null;
}

export default async function ParticipantAccessPage({
  params,
  searchParams,
}: ParticipantAccessPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await getOrganizationByCodeForRoom(code).catch(() => null);

  if (!organization) notFound();

  const context = await getParticipantRoomContext(code);
  const identifierValue = readSearchParam(resolvedSearchParams, "identifier");
  const verificationStep = readSearchParam(resolvedSearchParams, "step");
  const errorMessage = readSearchParam(resolvedSearchParams, "message");
  const cooldown = readSearchParam(resolvedSearchParams, "cooldown");
  const parsedCooldown = Number.parseInt(cooldown ?? "", 10);
  const hasCooldown =
    Number.isFinite(parsedCooldown) && parsedCooldown > 0 ? parsedCooldown : 0;
  const emailVerificationEnabled =
    organization.participant_identifier_type === "email";

  if (context) redirect(`/room/${code}/space`);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200/70">
              Verify access
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              {organization.name}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              {emailVerificationEnabled
                ? "Approved participants only. We send a code to your email before entry."
                : "Approved participants only. Enter the identifier set by the organizer."}
            </p>

            <div className="rounded-3xl border border-border bg-[var(--app-surface)] p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    Room code
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-foreground/85">
                    {organization.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    Method
                  </dt>
                  <dd className="mt-2 text-sm text-foreground/85">
                    {organization.participant_identifier_label}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-border pt-5">
                <h2 className="font-heading text-lg text-foreground">After entry</h2>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <li>See the votes and messages assigned to you.</li>
                  <li>Stay anonymous to other participants.</li>
                  <li>See results and reveals only if allowed.</li>
                </ul>
              </div>

              {emailVerificationEnabled ? (
                <p className="mt-5 text-sm text-muted-foreground/80">
                  Keep your email inbox open.
                </p>
              ) : null}
            </div>
          </section>

          <ParticipantAccessForm
            code={code}
            organizationName={organization.name}
            identifierLabel={organization.participant_identifier_label}
            identifierType={organization.participant_identifier_type}
            identifierValue={identifierValue ?? ""}
            verificationStep={verificationStep === "code"}
            cooldownSeconds={hasCooldown}
            error={
              readSearchParam(resolvedSearchParams, "error") === "rate-limited"
                ? null
                : getAccessErrorMessage(
                    readSearchParam(resolvedSearchParams, "error"),
                    errorMessage,
                    cooldown,
                  )
            }
            rateLimitBanner={
              readSearchParam(resolvedSearchParams, "error") === "rate-limited" ? (
                <RateLimitBanner
                  id="participant-access-error"
                  className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
                  prefix="Email provider rate limit exceeded. Wait "
                  suffix=" seconds and try again."
                  initialSeconds={hasCooldown}
                />
              ) : null
            }
            status={getAccessStatusMessage(
              readSearchParam(resolvedSearchParams, "status"),
            )}
          />
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/participant-access-form.tsx`**

```tsx
import { verifyParticipant } from "@/app/room/[code]/actions";
import type { IdentifierType } from "@/lib/feedback/types";
import SubmitButton from "@/components/ui/submit-button";
import CooldownSubmitButton from "@/components/ui/cooldown-submit-button";
import type { ReactNode } from "react";

type ParticipantAccessFormProps = {
  code: string;
  organizationName: string;
  identifierLabel: string;
  identifierType: IdentifierType;
  identifierValue: string;
  verificationStep: boolean;
  error: string | null;
  cooldownSeconds?: number;
  rateLimitBanner?: ReactNode;
  rateLimitBannerId?: string;
  status: string | null;
};

function getIdentifierInputType(identifierType: IdentifierType) {
  if (identifierType === "email") return "email";
  if (identifierType === "phone") return "tel";
  return "text";
}

function getIdentifierAutoComplete(identifierType: IdentifierType) {
  if (identifierType === "email") return "email";
  if (identifierType === "phone") return "tel";
  return "off";
}

function maskEmail(value: string) {
  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) return value;

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? ""}*`
      : `${localPart.slice(0, 2)}***`;
  const [domainName, ...rest] = domainPart.split(".");
  const maskedDomain =
    domainName.length <= 2
      ? `${domainName[0] ?? ""}*`
      : `${domainName.slice(0, 2)}***`;

  return `${maskedLocal}@${maskedDomain}${rest.length > 0 ? `.${rest.join(".")}` : ""}`;
}

export default function ParticipantAccessForm({
  code,
  organizationName,
  identifierLabel,
  identifierType,
  identifierValue,
  verificationStep,
  error,
  cooldownSeconds = 0,
  rateLimitBanner,
  rateLimitBannerId,
  status,
}: ParticipantAccessFormProps) {
  const action = verifyParticipant.bind(null, code);
  const inputType = getIdentifierInputType(identifierType);
  const describedBy = [
    status ? "participant-access-status" : null,
    error ? "participant-access-error" : null,
    rateLimitBanner ? rateLimitBannerId ?? "participant-access-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const isEmailFlow = identifierType === "email";
  const emailValue = identifierValue.trim();

  return (
    <article className="rounded-[2rem] border border-border bg-[var(--app-surface)]/95 p-8 shadow-[0_0_50px_rgba(8,15,26,0.12)] dark:shadow-[0_0_50px_rgba(8,15,26,0.45)]">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
          {isEmailFlow ? "Email" : "Access"}
        </p>
        <h2 className="font-heading text-2xl md:text-3xl">
          Enter {organizationName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEmailFlow
            ? verificationStep
              ? `Code requested for ${emailValue ? maskEmail(emailValue) : "your email"}. Check inbox and spam.`
              : "Enter your email to get a code."
            : "Enter the approved identifier."}
        </p>
      </div>

      {status ? (
        <p
          id="participant-access-status"
          className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
          role="status"
        >
          {status}
        </p>
      ) : null}

      {error ? (
        <p
          id="participant-access-error"
          className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : rateLimitBanner ? (
        rateLimitBanner
      ) : null}

      {isEmailFlow ? (
        verificationStep ? (
          <div className="mt-6 grid gap-5">
            <form action={action} className="grid gap-5">
              <input type="hidden" name="intent" value="verify" />
              <input type="hidden" name="identifierValue" value={emailValue} />
              <div className="grid gap-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-foreground/80"
                >
                  Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  required
                  maxLength={8}
                  className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 font-mono text-sm text-foreground outline-none transition focus:border-border/60"
                />
              </div>

              <SubmitButton
                label="Verify"
                pendingLabel="Verifying..."
                className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <form action={action} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="intent" value="request" />
              <input type="hidden" name="identifierValue" value={emailValue} />
              <CooldownSubmitButton
                label="Resend"
                pendingLabel="Sending..."
                initialCooldown={cooldownSeconds}
                className="inline-flex items-center justify-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
              />
              <a
                href={`/room/${code}`}
                className="text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Change email
              </a>
            </form>
          </div>
        ) : (
          <form action={action} className="mt-6 grid gap-5">
            <input type="hidden" name="intent" value="request" />
            <div className="grid gap-2">
              <label
                htmlFor="identifierValue"
                className="text-sm font-medium text-foreground/80"
              >
                {identifierLabel}
              </label>
              <input
                id="identifierValue"
                name="identifierValue"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                required
                className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60"
              />
            </div>

            <SubmitButton
              label="Send code"
              pendingLabel="Sending..."
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        )
      ) : (
        <form action={action} className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <label
              htmlFor="identifierValue"
              className="text-sm font-medium text-foreground/80"
            >
              {identifierLabel}
            </label>
            <input
              id="identifierValue"
              name="identifierValue"
              type={inputType}
              inputMode={inputType === "tel" ? "tel" : undefined}
              autoComplete={getIdentifierAutoComplete(identifierType)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              required
              className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60"
            />
          </div>

          <SubmitButton
            label="Enter room"
            pendingLabel="Entering..."
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: `participant-access-form.test.tsx` still passes — the OTP input still has `maxLength={8}` and the cooldown button label is unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/app/room/[code]/page.tsx src/components/participant-access-form.tsx
git commit -m "Update room access page and form: semantic tokens, OTP monospace, simplified info panel"
```

---

### Task 7: Update participant room component

**Files:**
- Modify: `src/components/participant-room.tsx`

This is the most significant change: the outer section-container cards (`rounded-[2rem] border bg-white/5 p-8`) become section containers (no border, subtle background), while inner item cards stay explicitly bordered.

- [ ] **Step 1: Replace `src/components/participant-room.tsx`**

```tsx
import {
  leaveParticipantRoom,
  revealParticipantMessage,
  submitParticipantMessage,
  submitParticipantVote,
} from "@/app/room/[code]/space/actions";
import type { ParticipantRoomData } from "@/lib/feedback/participants";
import BackgroundOrbs from "@/components/background-orbs";
import SubmitButton from "@/components/ui/submit-button";

type ParticipantRoomProps = {
  room: ParticipantRoomData;
  error: string | null;
  status: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export default function ParticipantRoom({
  room,
  error,
  status,
}: ParticipantRoomProps) {
  const voteAction = submitParticipantVote.bind(null, room.organizationCode);
  const messageAction = submitParticipantMessage.bind(null, room.organizationCode);
  const revealAction = revealParticipantMessage.bind(null, room.organizationCode);
  const leaveAction = leaveParticipantRoom.bind(null, room.organizationCode);
  const visibleResults = room.votes.filter((vote) => vote.canSeeResults);
  const hasVotes = room.votes.length > 0;
  const hasMessageChannels = room.messageChannels.length > 0;
  const hasPrivateMessages = room.privateMessages.length > 0;
  const hasVisibleResults = visibleResults.length > 0;
  const hasRevealedMessages = room.revealedMessages.length > 0;
  const accessSummaryItems = [
    {
      label: "Active votes",
      value: room.accessSummary.voteCount,
      description: "Open vote cards.",
    },
    {
      label: "Message channels",
      value: room.accessSummary.messageChannelCount,
      description: "Open message channels.",
    },
    {
      label: "Visible results",
      value: room.accessSummary.resultCount,
      description: "Results you can see.",
    },
    {
      label: "Revealed messages",
      value: room.accessSummary.revealedMessageCount,
      description: "Messages you can see.",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200/70">
              Room
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              {room.organizationName}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              You only see what your audience allows. Other participants do not
              see your identity.
            </p>
            {room.participantDisplayName ? (
              <p className="text-sm text-muted-foreground/80">
                Verified as {room.participantDisplayName}
              </p>
            ) : null}
          </div>

          <form action={leaveAction}>
            <SubmitButton
              label="Leave"
              pendingLabel="Leaving..."
              className="inline-flex items-center justify-center rounded-full border border-border bg-muted/50 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </header>

        {status ? (
          <p
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
            role="status"
          >
            {status}
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {accessSummaryItems.length > 0 ? (
          <section
            aria-label="What you can access"
            className="overflow-hidden rounded-3xl border border-border bg-[var(--app-surface)]"
          >
            <div className="grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
              {accessSummaryItems.map((item) => (
                <article key={item.label} className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section className="space-y-12">
            {hasVotes ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Votes
                  </p>
                  <h2 className="font-heading text-2xl">Votes</h2>
                  <p className="text-sm text-muted-foreground">
                    Vote while active. Closed votes stay visible.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.votes.map((vote) => (
                    <article
                      key={vote.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {vote.tag}
                        </span>
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {vote.status}
                        </span>
                        {vote.participantChoice ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-100">
                            Your vote: {vote.participantChoice}
                          </span>
                        ) : null}
                      </div>

                      {vote.imageUrl ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={vote.imageUrl}
                            alt={vote.title}
                            loading="lazy"
                            className="h-52 w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {vote.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {vote.description}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <form action={voteAction}>
                          <input type="hidden" name="voteId" value={vote.id} />
                          <input type="hidden" name="choice" value="support" />
                          <SubmitButton
                            label="Support"
                            pendingLabel="Supporting..."
                            disabled={vote.status !== "active"}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-100"
                          />
                        </form>
                        <form action={voteAction}>
                          <input type="hidden" name="voteId" value={vote.id} />
                          <input type="hidden" name="choice" value="oppose" />
                          <SubmitButton
                            label="Oppose"
                            pendingLabel="Opposing..."
                            disabled={vote.status !== "active"}
                            className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/15 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-100"
                          />
                        </form>
                      </div>

                      {vote.canSeeResults ? (
                        <div className="mt-5 space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{vote.supportCount} support</span>
                            <span>{vote.opposeCount} oppose</span>
                            <span>{vote.totalCount} total</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                              style={{
                                width: `${Math.round(
                                  (vote.supportCount / (vote.totalCount || 1)) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-5 text-sm text-muted-foreground/70">
                          Results are hidden until opened.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasMessageChannels ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Messages
                  </p>
                  <h2 className="font-heading text-2xl">Messages</h2>
                  <p className="text-sm text-muted-foreground">
                    Send feedback anonymously. Only revealed messages return here.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.messageChannels.map((channel) => (
                    <article
                      key={channel.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {channel.status}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {
                            room.revealedMessages.filter(
                              (message) => message.channelId === channel.id,
                            ).length
                          }{" "}
                          visible
                          {room.revealedMessages.filter(
                            (message) => message.channelId === channel.id,
                          ).length === 1
                            ? ""
                            : "s"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {channel.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {channel.prompt}
                      </p>

                      <form action={messageAction} className="mt-5 grid gap-3">
                        <input
                          type="hidden"
                          name="channelId"
                          value={channel.id}
                        />
                        <label
                          htmlFor={`message-${channel.id}`}
                          className="text-sm font-medium text-foreground/80"
                        >
                          Message
                        </label>
                        <textarea
                          id={`message-${channel.id}`}
                          name="body"
                          rows={5}
                          disabled={channel.status !== "open"}
                          className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <SubmitButton
                          label="Send"
                          pendingLabel="Sending..."
                          disabled={channel.status !== "open"}
                          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        />
                      </form>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasPrivateMessages ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Private messages
                  </p>
                  <h2 className="font-heading text-2xl">Reveal</h2>
                  <p className="text-sm text-muted-foreground">
                    These messages are for you. Reveal them when ready.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.privateMessages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-3xl border border-cyan-400/20 bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-100">
                          Private to you
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {message.channelTitle}
                      </h3>
                      <p className="mt-2 text-sm text-foreground/80">{message.body}</p>
                      <form action={revealAction} className="mt-5">
                        <input type="hidden" name="messageId" value={message.id} />
                        <SubmitButton
                          label="Reveal"
                          pendingLabel="Revealing..."
                          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </form>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <aside className="space-y-12">
            {hasVisibleResults ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Results
                  </p>
                  <h2 className="font-heading text-2xl">Results</h2>
                </div>

                <div className="space-y-4">
                  {visibleResults.map((vote) => (
                    <article
                      key={vote.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-foreground">
                          {vote.title}
                        </h3>
                        <span className="text-xs text-muted-foreground/60">
                          {vote.totalCount} total
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Support</span>
                          <span>{vote.supportCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Oppose</span>
                          <span>{vote.opposeCount}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasRevealedMessages ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Revealed
                  </p>
                  <h2 className="font-heading text-2xl">Revealed</h2>
                </div>

                <div className="space-y-4">
                  {room.revealedMessages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground/60">
                        <span>{message.channelTitle}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-4 text-sm text-foreground/80">
                        {message.body}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/participant-room.tsx
git commit -m "Restructure participant room: flat section hierarchy, semantic tokens"
```

---

### Task 8: Update AdminShell and OrgAdminNav

**Files:**
- Modify: `src/components/admin-shell.tsx`
- Modify: `src/components/org-admin-nav.tsx`

- [ ] **Step 1: Replace `src/components/admin-shell.tsx`**

```tsx
import type { ReactNode } from "react";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";
import OrgAdminNav from "@/components/org-admin-nav";

type AdminShellProps = {
  title: string;
  description: string;
  code?: string;
  children: ReactNode;
};

export default function AdminShell({
  title,
  description,
  code,
  children,
}: AdminShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />

        <section className="rounded-[2rem] border border-border bg-[var(--app-surface)]/40 p-6 md:p-8">
          <div className="space-y-6">
            <header className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Admin
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    {description}
                  </p>
                </div>
                {code ? (
                  <div className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
                      Organization code
                    </p>
                    <p className="mt-1 font-mono text-sm text-foreground/85">{code}</p>
                  </div>
                ) : null}
              </div>
            </header>

            {code ? <OrgAdminNav code={code} /> : null}

            <div className="space-y-6">{children}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/org-admin-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type OrgAdminNavProps = {
  code: string;
};

const navItems = [
  { label: "Overview", slug: "" },
  { label: "Participants", slug: "participants" },
  { label: "Levels", slug: "levels" },
  { label: "Votes", slug: "votes" },
  { label: "Messages", slug: "messages" },
];

function isActivePath(pathname: string, href: string, slug: string) {
  if (!slug) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OrgAdminNav({ code }: OrgAdminNavProps) {
  const pathname = usePathname() ?? "";
  const basePath = `/admin/org/${code}`;

  return (
    <nav
      aria-label="Organization admin navigation"
      className="flex flex-wrap gap-2"
    >
      {navItems.map(({ label, slug }) => {
        const href = slug ? `${basePath}/${slug}` : basePath;
        const active = isActivePath(pathname, href, slug);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-border bg-foreground text-background shadow-sm"
                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: `org-admin-nav.test.tsx` still passes — it only checks that the nav links render, not their styling.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin-shell.tsx src/components/org-admin-nav.tsx
git commit -m "Update AdminShell and OrgAdminNav: semantic tokens, remove double-card nesting"
```

---

### Task 9: Update admin dashboard and org overview pages

**Files:**
- Modify: `src/app/(protected)/admin/page.tsx`
- Modify: `src/app/(protected)/admin/org/[code]/page.tsx`

- [ ] **Step 1: Replace `src/app/(protected)/admin/page.tsx`**

```tsx
import Link from "next/link";

import AdminShell from "@/components/admin-shell";
import { listOwnedOrganizations } from "@/lib/feedback/organizations";

export default async function AdminPage() {
  const organizations = await listOwnedOrganizations();

  return (
    <AdminShell
      title="Admin dashboard"
      description="Create and manage workspaces."
    >
      <section className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl">Your organizations</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Open a workspace or create one.
            </p>
          </div>
          <Link
            href="/admin/org/new"
            className="button-surface inline-flex w-fit items-center px-5 py-3 text-sm font-semibold transition"
          >
            Create workspace
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.length > 0 ? (
            organizations.map((organization) => (
              <article
                key={organization.id}
                className="rounded-3xl border border-border bg-[var(--app-card)] p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
                  Org
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {organization.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {organization.participant_identifier_label}
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground/60">
                  {organization.code}
                </p>
                <Link
                  href={`/admin/org/${organization.code}`}
                  className="button-surface mt-5 inline-flex items-center px-4 py-2 text-sm font-medium transition"
                >
                  Open
                </Link>
              </article>
            ))
          ) : (
            <article className="rounded-3xl border border-dashed border-border bg-muted/50 p-6 md:col-span-2 xl:col-span-3">
              <h3 className="text-lg font-semibold text-foreground">
                No workspaces yet
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Create one to begin.
              </p>
            </article>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
```

- [ ] **Step 2: Replace `src/app/(protected)/admin/org/[code]/page.tsx`**

```tsx
import Link from "next/link";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";

export default async function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const organization = await requireOwnedOrganization(code);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <h2 className="font-heading text-2xl text-foreground">Overview</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Manage participants, levels, votes, and messages here.
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-[var(--app-card)] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
            Organization code
          </p>
          <p className="mt-2 font-mono text-sm text-foreground/85">
            {organization.code}
          </p>
        </div>
      </article>

      <aside className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <h2 className="font-heading text-xl text-foreground">Next steps</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Go to the admin dashboard or keep editing this workspace.
        </p>
        <Link
          href="/admin"
          className="button-surface mt-6 inline-flex items-center px-4 py-2 text-sm font-medium transition"
        >
          Back to admin
        </Link>
      </aside>
    </section>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/admin/page.tsx" "src/app/(protected)/admin/org/[code]/page.tsx"
git commit -m "Update admin dashboard and org overview: semantic tokens"
```

---

### Task 10: Update admin org tab pages (participants, levels, votes, messages)

**Files:**
- Modify: `src/app/(protected)/admin/org/[code]/participants/page.tsx`
- Modify: `src/app/(protected)/admin/org/[code]/levels/page.tsx`
- Modify: `src/app/(protected)/admin/org/[code]/votes/page.tsx`
- Modify: `src/app/(protected)/admin/org/[code]/messages/page.tsx`

Apply the Colour Replacement Reference to all four files. The structural changes are minimal — only colour tokens change. The following diff pattern covers every occurrence in each file:

**Common replacements across all four files:**
- `border border-white/10 bg-[#0f141d]` → `border border-border bg-[var(--app-surface)]`
- `border border-white/10 bg-[#0b1018]` → `border border-border bg-[var(--app-card)]`
- `border border-white/10 bg-white/5` → `border border-border bg-muted/50`
- `border border-dashed border-white/10 bg-white/5` → `border border-dashed border-border bg-muted/50`
- `text-white` → `text-foreground` (where not followed by `/`)
- `text-white/XX` → use Colour Replacement Reference
- `border-white/10` → `border-border`
- `text-emerald-100` (standalone, not in dark: context) → `text-emerald-700 dark:text-emerald-100`
- `text-rose-100` (standalone) → `text-rose-700 dark:text-rose-100`
- `text-amber-100` (standalone) → `text-amber-700 dark:text-amber-100`
- `text-cyan-100` (standalone) → `text-cyan-700 dark:text-cyan-100`
- `text-cyan-200/70` → `text-cyan-600 dark:text-cyan-200/70`
- `text-amber-200/70` → `text-amber-600 dark:text-amber-200/70`
- `text-emerald-200/70` → `text-emerald-600 dark:text-emerald-200/70`

**For SubmitButton classNames in admin pages** that use `bg-white ... text-[#0b0f15]`:
Replace:
```
className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
```
With:
```
className="mt-6 inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
```
(Same pattern for cyan-100 and any other hover tint — replace with `hover:opacity-90`.)

**For SubmitButton classNames** that use `bg-white/5 border border-white/15 text-white/80`:
Replace with `bg-muted/50 border border-border text-foreground/80`.

- [ ] **Step 1: Apply replacements to `participants/page.tsx`**

Open `src/app/(protected)/admin/org/[code]/participants/page.tsx` and apply all colour replacements from the reference above. Specific changes:
- Line 73: `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Line 85, 93: `bg-white/5` → `bg-muted/50`; `border-white/10` → `border-border`
- Line 107: `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Line 158, 183: input `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`; `focus:border-white/25` → `focus:border-border/60`
- Line 197: level label `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`
- Line 233: SubmitButton → `bg-foreground text-background hover:opacity-90` (remove `border-white/15 bg-white text-[#0b0f15] hover:bg-cyan-100`)
- Line 241: list card `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Line 264: item card `bg-[#0b1018]` → `bg-[var(--app-card)]`
- Line 276: status badge `border-emerald-400/20 bg-emerald-400/10 text-emerald-100` → add `dark:text-emerald-100 text-emerald-700`
- Line 290: level badge `border-cyan-300/15 bg-cyan-300/10 text-cyan-100` → add `dark:text-cyan-100 text-cyan-700`
- Line 316: Delete SubmitButton → `bg-muted/50 border border-border text-foreground/70 hover:bg-muted`
- Line 324: empty state → `border-border bg-muted/50 text-muted-foreground`
- All `text-white/*` → Colour Replacement Reference

- [ ] **Step 2: Apply replacements to `levels/page.tsx`**

Open `src/app/(protected)/admin/org/[code]/levels/page.tsx` and apply:
- Line 50, 80, 127: `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Line 59, 67: stat cards `bg-white/5` → `bg-muted/50`; `border-white/10` → `border-border`
- Line 115: input `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`; `focus:border-white/25` → `focus:border-border/60`
- Line 122: SubmitButton → `bg-foreground text-background hover:opacity-90`
- Line 148: item card `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`
- Line 160: position badge `border-amber-300/15 bg-amber-300/10 text-amber-100` → `text-amber-700 dark:text-amber-100`
- Line 175: empty state → `border-border bg-muted/50 text-muted-foreground`
- All `text-white/*` → Colour Replacement Reference
- `text-amber-200/70` → `text-amber-600 dark:text-amber-200/70`

- [ ] **Step 3: Apply replacements to `votes/page.tsx`**

Open `src/app/(protected)/admin/org/[code]/votes/page.tsx` and apply:
- Lines 69, 99, 153: `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Lines 78–85: stat cards `bg-white/5` → `bg-muted/50`; `border-white/10` → `border-border`
- Line 175: item card `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`
- Line 194: tag badge `border-cyan-300/15 bg-cyan-300/10 text-cyan-100` → `text-cyan-700 dark:text-cyan-100`
- Lines 224–252: level pills `bg-white/5 border-white/10` → `bg-muted/50 border-border`
- Line 274: empty state → `border-border bg-muted/50 text-muted-foreground`
- All `text-white/*` → Colour Replacement Reference
- `text-cyan-200/70` → `text-cyan-600 dark:text-cyan-200/70`

- [ ] **Step 4: Apply replacements to `messages/page.tsx`**

Open `src/app/(protected)/admin/org/[code]/messages/page.tsx` and apply:
- Lines 119–136: stat cards `bg-white/5` → `bg-muted/50`; `border-white/10` → `border-border`
- Line 192, 321: section cards `bg-[#0f141d]` → `bg-[var(--app-surface)]`
- Lines 215, 388, 395: item cards `bg-[#0b1018]` → `bg-[var(--app-card)]`; `border-white/10` → `border-border`
- Line 353: revealed badge `border-emerald-400/25 bg-emerald-400/10 text-emerald-100` → `text-emerald-700 dark:text-emerald-100`
- Line 379: SubmitButton → `bg-muted/50 border border-border text-foreground/80 hover:bg-muted hover:text-foreground`
- Lines 315, 410: empty states → `border-border bg-muted/50 text-muted-foreground`
- All `text-white/*` → Colour Replacement Reference
- `text-emerald-200/70` → `text-emerald-600 dark:text-emerald-200/70`

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(protected)/admin/org/[code]/participants/page.tsx" "src/app/(protected)/admin/org/[code]/levels/page.tsx" "src/app/(protected)/admin/org/[code]/votes/page.tsx" "src/app/(protected)/admin/org/[code]/messages/page.tsx"
git commit -m "Update admin org tab pages: semantic tokens across participants, levels, votes, messages"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 17 files listed in the spec have a corresponding task. Bug fixes (label/input, OTP monospace, button scope, orb divs) all covered.
- [x] **Placeholder scan:** No TBDs. Task 10 uses a reference table instead of placeholders — the full replacement list is provided inline.
- [x] **Type consistency:** `BackgroundOrbs` variant prop is `"default" | "minimal"` in Task 3 and consumed as `variant="minimal"` in Tasks 5, 8. `ThemeToggle` exports a default, consumed in Task 4 Breadcrumbs. No name mismatches.
- [x] **Test impact:** `home-page.test.tsx` updated in Task 4 to mock `next/navigation` and `next-themes`. `participant-access-form.test.tsx` unaffected (OTP maxLength and cooldown label unchanged). `org-admin-nav.test.tsx` unaffected (only checks link presence, not styling).
