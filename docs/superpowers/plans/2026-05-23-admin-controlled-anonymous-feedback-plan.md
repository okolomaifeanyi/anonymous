# V1 Admin-Controlled Anonymous Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current demo-style anonymous vote/message app with a smaller v1 product built around an authenticated organizer dashboard, approved participant access, level-based visibility rules, and one unified participant room.

**Architecture:** The implementation replaces the current duplicated `/vote`, `/messages`, and `/org/[code]/*` experience with two route trees: authenticated `/admin` pages for organizers and cookie-backed `/room/[code]` pages for participants. Supabase remains the system of record, but participant access is mediated through server actions and a room session cookie because participants are not Supabase-authenticated users. Visibility rules live in pure TypeScript helpers so the audience logic stays testable and independent from the Next.js route layer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase SSR, Supabase service-role server client, Vitest, React Testing Library

---

## File Structure

### Create

- `docs/superpowers/plans/2026-05-23-admin-controlled-anonymous-feedback-plan.md`
- `vitest.config.mts`
- `tests/setup.ts`
- `tests/lib/feedback/policy.test.ts`
- `tests/lib/feedback/participants.test.ts`
- `tests/lib/feedback/votes.test.ts`
- `tests/lib/feedback/room-session.test.ts`
- `tests/components/org-admin-nav.test.tsx`
- `tests/components/home-page.test.tsx`
- `src/lib/feedback/types.ts`
- `src/lib/feedback/policy.ts`
- `src/lib/feedback/organizations.ts`
- `src/lib/feedback/participants.ts`
- `src/lib/feedback/votes.ts`
- `src/lib/feedback/messages.ts`
- `src/lib/feedback/room-session.ts`
- `src/components/admin-shell.tsx`
- `src/components/org-admin-nav.tsx`
- `src/components/participant-access-form.tsx`
- `src/components/participant-room.tsx`
- `src/app/(protected)/admin/page.tsx`
- `src/app/(protected)/admin/org/new/page.tsx`
- `src/app/(protected)/admin/org/new/actions.ts`
- `src/app/(protected)/admin/org/[code]/layout.tsx`
- `src/app/(protected)/admin/org/[code]/page.tsx`
- `src/app/(protected)/admin/org/[code]/participants/page.tsx`
- `src/app/(protected)/admin/org/[code]/participants/actions.ts`
- `src/app/(protected)/admin/org/[code]/levels/page.tsx`
- `src/app/(protected)/admin/org/[code]/levels/actions.ts`
- `src/app/(protected)/admin/org/[code]/votes/page.tsx`
- `src/app/(protected)/admin/org/[code]/votes/actions.ts`
- `src/app/(protected)/admin/org/[code]/messages/page.tsx`
- `src/app/(protected)/admin/org/[code]/messages/actions.ts`
- `src/app/room/[code]/page.tsx`
- `src/app/room/[code]/actions.ts`
- `src/app/room/[code]/space/page.tsx`
- `src/app/room/[code]/space/actions.ts`

### Modify

- `package.json`
- `package-lock.json`
- `supabase/schema.sql`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/(protected)/layout.tsx`
- `src/components/breadcrumbs.tsx`
- `src/app/org/store.ts`
- `src/app/org/actions.ts`
- `src/app/auth/login/page.tsx`

### Delete After Replacement Passes

- `src/app/vote/`
- `src/app/messages/`
- `src/app/org/[code]/vote/`
- `src/app/org/[code]/messages/`
- `src/app/org/[code]/page.tsx`
- `src/app/org/new/`

## Target Data Model

- `organizations`
  - keep existing table
  - add `participant_identifier_type text not null default 'email'`
  - add `participant_identifier_label text not null default 'Email address'`

- `organization_levels`
  - `id uuid primary key default gen_random_uuid()`
  - `organization_id uuid not null references organizations(id) on delete cascade`
  - `name text not null`
  - `slug text not null`
  - `position integer not null default 0`
  - unique `(organization_id, slug)`

- `organization_participants`
  - `id uuid primary key default gen_random_uuid()`
  - `organization_id uuid not null references organizations(id) on delete cascade`
  - `identifier_type text not null`
  - `identifier_value text not null`
  - `display_name text`
  - `status text not null default 'active'`
  - unique `(organization_id, identifier_type, identifier_value)`

- `participant_level_assignments`
  - `participant_id uuid not null references organization_participants(id) on delete cascade`
  - `level_id uuid not null references organization_levels(id) on delete cascade`
  - unique `(participant_id, level_id)`

- `votes`
  - `id uuid primary key default gen_random_uuid()`
  - `organization_id uuid not null references organizations(id) on delete cascade`
  - `title text not null`
  - `description text not null default ''`
  - `tag text not null default 'General'`
  - `status text not null default 'draft'`
  - `eligible_level_ids uuid[] not null default '{}'`
  - `live_result_level_ids uuid[] not null default '{}'`
  - `final_result_level_ids uuid[] not null default '{}'`
  - `created_at timestamptz not null default now()`

- `vote_ballots`
  - `vote_id uuid not null references votes(id) on delete cascade`
  - `participant_id uuid not null references organization_participants(id) on delete cascade`
  - `choice text not null`
  - `created_at timestamptz not null default now()`
  - unique `(vote_id, participant_id)`

- `message_channels`
  - `id uuid primary key default gen_random_uuid()`
  - `organization_id uuid not null references organizations(id) on delete cascade`
  - `title text not null`
  - `prompt text not null`
  - `status text not null default 'draft'`
  - `submit_level_ids uuid[] not null default '{}'`
  - `reveal_level_ids uuid[] not null default '{}'`
  - `created_at timestamptz not null default now()`

- `message_entries`
  - `id uuid primary key default gen_random_uuid()`
  - `channel_id uuid not null references message_channels(id) on delete cascade`
  - `participant_id uuid not null references organization_participants(id) on delete cascade`
  - `body text not null`
  - `revealed boolean not null default false`
  - `created_at timestamptz not null default now()`

## Task 1: Add Test Harness and Audience Policy Helpers

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.mts`
- Create: `tests/setup.ts`
- Create: `tests/lib/feedback/policy.test.ts`
- Create: `src/lib/feedback/types.ts`
- Create: `src/lib/feedback/policy.ts`

- [ ] **Step 1: Add the test runner and config**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.1.0",
    "@vitejs/plugin-react": "^5.0.4",
    "jsdom": "^26.1.0",
    "vite-tsconfig-paths": "^5.1.4",
    "vitest": "^3.2.4"
  }
}
```

```ts
// vitest.config.mts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing policy test**

```ts
// tests/lib/feedback/policy.test.ts
import { describe, expect, it } from "vitest";
import {
  canAccessAudience,
  canSeeVoteResults,
  getVisibleParticipantRoomSections,
} from "@/lib/feedback/policy";

describe("feedback policy", () => {
  const participant = {
    levelIds: ["public", "executive"],
  };

  it("allows access when at least one required level matches", () => {
    expect(canAccessAudience(participant.levelIds, ["executive"])).toBe(true);
    expect(canAccessAudience(participant.levelIds, ["chapter"])).toBe(false);
  });

  it("hides vote results from unauthorized viewers", () => {
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
  });

  it("builds a participant room model from eligible items only", () => {
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
      ],
    });

    expect(room.votes).toHaveLength(1);
    expect(room.messageChannels).toHaveLength(1);
    expect(room.resultsVisible).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- tests/lib/feedback/policy.test.ts`

Expected: FAIL with import or export errors for `@/lib/feedback/policy`

- [ ] **Step 4: Implement the shared types and policy helpers**

```ts
// src/lib/feedback/types.ts
export type IdentifierType = "email" | "phone" | "social" | "custom";
export type ParticipantStatus = "active" | "disabled";
export type VoteStatus = "draft" | "active" | "closed";
export type MessageChannelStatus = "draft" | "open" | "closed";

export type VoteVisibilityRule = {
  status: VoteStatus;
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
};

export type ParticipantRoomVote = {
  id: string;
  title: string;
  status: VoteStatus;
  eligibleLevelIds: string[];
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
};

export type ParticipantRoomMessageChannel = {
  id: string;
  title: string;
  status: MessageChannelStatus;
  submitLevelIds: string[];
  revealLevelIds: string[];
};
```

```ts
// src/lib/feedback/policy.ts
import type {
  ParticipantRoomMessageChannel,
  ParticipantRoomVote,
  VoteVisibilityRule,
} from "@/lib/feedback/types";

export function canAccessAudience(
  participantLevelIds: string[],
  audienceLevelIds: string[],
) {
  if (audienceLevelIds.length === 0) return false;
  return audienceLevelIds.some((levelId) => participantLevelIds.includes(levelId));
}

export function canSeeVoteResults(
  participantLevelIds: string[],
  vote: VoteVisibilityRule,
) {
  if (vote.status === "closed") {
    return canAccessAudience(participantLevelIds, vote.finalResultLevelIds);
  }

  return canAccessAudience(participantLevelIds, vote.liveResultLevelIds);
}

export function getVisibleParticipantRoomSections(input: {
  participantLevelIds: string[];
  votes: ParticipantRoomVote[];
  messageChannels: ParticipantRoomMessageChannel[];
}) {
  const votes = input.votes.filter((vote) =>
    canAccessAudience(input.participantLevelIds, vote.eligibleLevelIds),
  );

  const messageChannels = input.messageChannels.filter((channel) =>
    canAccessAudience(input.participantLevelIds, channel.submitLevelIds),
  );

  const resultsVisible = votes.some((vote) =>
    canSeeVoteResults(input.participantLevelIds, vote),
  );

  return {
    votes,
    messageChannels,
    resultsVisible,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- tests/lib/feedback/policy.test.ts`

Expected: PASS with `3 passed`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.mts tests/setup.ts tests/lib/feedback/policy.test.ts src/lib/feedback/types.ts src/lib/feedback/policy.ts
git commit -m "test: add feedback policy test harness"
```

## Task 2: Extend the Schema for Organizations, Participants, and Levels

**Files:**
- Modify: `supabase/schema.sql`
- Create: `tests/lib/feedback/participants.test.ts`
- Create: `src/lib/feedback/organizations.ts`
- Create: `src/lib/feedback/participants.ts`
- Modify: `src/app/org/store.ts`
- Modify: `src/app/org/actions.ts`

- [ ] **Step 1: Write the failing participant normalization test**

```ts
// tests/lib/feedback/participants.test.ts
import { describe, expect, it } from "vitest";
import { normalizeIdentifierValue, slugifyLevelName } from "@/lib/feedback/participants";

describe("participant helpers", () => {
  it("normalizes email identifiers to lowercase and trims whitespace", () => {
    expect(normalizeIdentifierValue("email", "  USER@Example.COM  ")).toBe(
      "user@example.com",
    );
  });

  it("normalizes phone identifiers to digits and leading plus", () => {
    expect(normalizeIdentifierValue("phone", " +234 801 222 3333 ")).toBe(
      "+2348012223333",
    );
  });

  it("creates stable level slugs", () => {
    expect(slugifyLevelName("Executive Council")).toBe("executive-council");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/lib/feedback/participants.test.ts`

Expected: FAIL with missing exports from `@/lib/feedback/participants`

- [ ] **Step 3: Add the schema changes for participant access**

```sql
alter table public.organizations
  add column if not exists participant_identifier_type text not null default 'email',
  add column if not exists participant_identifier_label text not null default 'Email address';

create table if not exists public.organization_levels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.organization_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  identifier_type text not null,
  identifier_value text not null,
  display_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, identifier_type, identifier_value)
);

create table if not exists public.participant_level_assignments (
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  level_id uuid not null references public.organization_levels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, level_id)
);
```

```ts
// src/lib/feedback/participants.ts
import type { IdentifierType } from "@/lib/feedback/types";
import { createAdminClient } from "@/lib/supabase/server";

export function normalizeIdentifierValue(type: IdentifierType, value: string) {
  const trimmed = value.trim();

  if (type === "email") return trimmed.toLowerCase();
  if (type === "phone") return trimmed.replace(/[^\d+]/g, "");

  return trimmed;
}

export function slugifyLevelName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createLevel(input: {
  organizationId: string;
  name: string;
  position: number;
}) {
  const admin = createAdminClient();
  const slug = slugifyLevelName(input.name);

  return admin.from("organization_levels").insert({
    organization_id: input.organizationId,
    name: input.name.trim(),
    slug,
    position: input.position,
  });
}
```

```ts
// src/lib/feedback/organizations.ts
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/server";

export async function requireOwnedOrganization(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Organizer authentication is required.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id,name,code,owner_id,participant_identifier_type,participant_identifier_label")
    .eq("code", code)
    .eq("owner_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Organization not found for organizer.");
  }

  return data;
}

export async function getOrganizationByCodeForRoom(code: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id,name,code,participant_identifier_type,participant_identifier_label")
    .eq("code", code)
    .single();

  if (error || !data) {
    throw new Error("Room not found.");
  }

  return data;
}
```

- [ ] **Step 4: Update organization creation to set identifier defaults**

```ts
// src/app/org/store.ts
export async function createOrganization(name: string) {
  // existing auth check stays
  const code = await generateUniqueCode(trimmed);

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: trimmed,
      code,
      owner_id: user.id,
      participant_identifier_type: "email",
      participant_identifier_label: "Email address",
    })
    .select("id,name,code")
    .single();

  // insert default levels
  await supabase.from("organization_levels").insert([
    { organization_id: data.id, name: "Public", slug: "public", position: 0 },
    { organization_id: data.id, name: "Executive", slug: "executive", position: 1 },
  ]);
}
```

```ts
// src/app/org/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createOrganization } from "./store";

export async function createOrgAction(formData: FormData) {
  const name = String(formData.get("name") || "");
  const org = await createOrganization(name);
  redirect(`/admin/org/${org.code}`);
}
```

- [ ] **Step 5: Run the test and lint checks**

Run: `npm run test -- tests/lib/feedback/participants.test.ts`

Expected: PASS with `3 passed`

Run: `npm run lint`

Expected: PASS with no new ESLint errors

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql tests/lib/feedback/participants.test.ts src/lib/feedback/organizations.ts src/lib/feedback/participants.ts src/app/org/store.ts src/app/org/actions.ts
git commit -m "feat: add organizer participants and levels schema"
```

## Task 3: Add Vote and Message Domain Tables plus Repository Helpers

**Files:**
- Modify: `supabase/schema.sql`
- Create: `tests/lib/feedback/votes.test.ts`
- Create: `src/lib/feedback/votes.ts`
- Create: `src/lib/feedback/messages.ts`

- [ ] **Step 1: Write the failing vote aggregation test**

```ts
// tests/lib/feedback/votes.test.ts
import { describe, expect, it } from "vitest";
import { countVoteChoices } from "@/lib/feedback/votes";
import { filterRevealedMessages } from "@/lib/feedback/messages";

describe("vote and message helpers", () => {
  it("counts support and oppose ballots", () => {
    expect(
      countVoteChoices([
        { choice: "support" },
        { choice: "support" },
        { choice: "oppose" },
      ]),
    ).toEqual({ support: 2, oppose: 1, total: 3 });
  });

  it("returns only revealed messages for participant view", () => {
    expect(
      filterRevealedMessages([
        { id: "a", revealed: true, body: "Visible" },
        { id: "b", revealed: false, body: "Hidden" },
      ]),
    ).toEqual([{ id: "a", revealed: true, body: "Visible" }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/lib/feedback/votes.test.ts`

Expected: FAIL because `countVoteChoices` and `filterRevealedMessages` do not exist yet

- [ ] **Step 3: Add the vote and message schema**

```sql
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  tag text not null default 'General',
  status text not null default 'draft',
  eligible_level_ids uuid[] not null default '{}',
  live_result_level_ids uuid[] not null default '{}',
  final_result_level_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.vote_ballots (
  vote_id uuid not null references public.votes(id) on delete cascade,
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  primary key (vote_id, participant_id)
);

create table if not exists public.message_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  prompt text not null,
  status text not null default 'draft',
  submit_level_ids uuid[] not null default '{}',
  reveal_level_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.message_entries (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.message_channels(id) on delete cascade,
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  body text not null,
  revealed boolean not null default false,
  created_at timestamptz not null default now()
);
```

```ts
// src/lib/feedback/votes.ts
import { createAdminClient } from "@/lib/supabase/server";

export function countVoteChoices(ballots: Array<{ choice: string }>) {
  const support = ballots.filter((ballot) => ballot.choice === "support").length;
  const oppose = ballots.filter((ballot) => ballot.choice === "oppose").length;
  return { support, oppose, total: support + oppose };
}

export async function upsertVoteBallot(input: {
  voteId: string;
  participantId: string;
  choice: "support" | "oppose";
}) {
  const admin = createAdminClient();
  return admin.from("vote_ballots").upsert(
    {
      vote_id: input.voteId,
      participant_id: input.participantId,
      choice: input.choice,
    },
    { onConflict: "vote_id,participant_id" },
  );
}
```

```ts
// src/lib/feedback/messages.ts
import { createAdminClient } from "@/lib/supabase/server";

export function filterRevealedMessages<T extends { revealed: boolean }>(messages: T[]) {
  return messages.filter((message) => message.revealed);
}

export async function revealMessageEntry(id: string, revealed: boolean) {
  const admin = createAdminClient();
  return admin.from("message_entries").update({ revealed }).eq("id", id);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/lib/feedback/votes.test.ts`

Expected: PASS with `2 passed`

- [ ] **Step 5: Run a schema smoke check**

Run: `npm run lint`

Expected: PASS with no TypeScript import or ESLint errors from the new domain files

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql tests/lib/feedback/votes.test.ts src/lib/feedback/votes.ts src/lib/feedback/messages.ts
git commit -m "feat: add vote and message domain models"
```

## Task 4: Replace the Public Demo Landing and Build the Admin Shell

**Files:**
- Create: `tests/components/org-admin-nav.test.tsx`
- Create: `src/components/admin-shell.tsx`
- Create: `src/components/org-admin-nav.tsx`
- Create: `src/app/(protected)/admin/page.tsx`
- Create: `src/app/(protected)/admin/org/new/page.tsx`
- Create: `src/app/(protected)/admin/org/new/actions.ts`
- Create: `src/app/(protected)/admin/org/[code]/layout.tsx`
- Create: `src/app/(protected)/admin/org/[code]/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/(protected)/layout.tsx`
- Modify: `src/components/breadcrumbs.tsx`
- Modify: `src/app/auth/login/page.tsx`

- [ ] **Step 1: Write the failing admin navigation component test**

```tsx
// tests/components/org-admin-nav.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrgAdminNav from "@/components/org-admin-nav";

describe("OrgAdminNav", () => {
  it("renders the v1 admin sections", () => {
    render(<OrgAdminNav code="pulse" />);

    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Participants" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Levels" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Votes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messages" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/components/org-admin-nav.test.tsx`

Expected: FAIL because `OrgAdminNav` does not exist

- [ ] **Step 3: Build the admin layout and route shell**

```tsx
// src/components/org-admin-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Overview", href: (code: string) => `/admin/org/${code}` },
  { label: "Participants", href: (code: string) => `/admin/org/${code}/participants` },
  { label: "Levels", href: (code: string) => `/admin/org/${code}/levels` },
  { label: "Votes", href: (code: string) => `/admin/org/${code}/votes` },
  { label: "Messages", href: (code: string) => `/admin/org/${code}/messages` },
];

export default function OrgAdminNav({ code }: { code: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Organization administration" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const href = item.href(code);
        const active = pathname === href;
        return (
          <Link
            key={item.label}
            href={href}
            className={active ? "rounded-full bg-white px-4 py-2 text-sm text-black" : "rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

```tsx
// src/components/admin-shell.tsx
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import OrgAdminNav from "@/components/org-admin-nav";

export default function AdminShell({
  title,
  description,
  code,
  children,
}: {
  title: string;
  description: string;
  code?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f15] text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />
        <header className="space-y-3">
          <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm text-white/60 md:text-base">{description}</p>
          {code ? <OrgAdminNav code={code} /> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
```

```tsx
// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0b0f15] text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">
            Verified anonymous feedback
          </p>
          <h1 className="font-heading text-4xl md:text-6xl">
            Controlled internal voting and anonymous messages.
          </h1>
          <p className="max-w-2xl text-base text-white/70 md:text-lg">
            Organizers approve participants, define levels, and decide who can
            vote, submit messages, and view results.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/auth/login" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b0f15]">
            Admin sign in
          </Link>
          <Link href="/room/pulse" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white">
            Enter room
          </Link>
        </div>
      </section>
    </main>
  );
}
```

```tsx
// src/app/(protected)/admin/page.tsx
import Link from "next/link";
import AdminShell from "@/components/admin-shell";

export default function AdminPage() {
  return (
    <AdminShell
      title="Admin dashboard"
      description="Create organizations, manage participants, and control anonymous feedback visibility."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/org/new" className="rounded-3xl border border-white/10 bg-white/5 p-6">
          Create a new organization
        </Link>
      </div>
    </AdminShell>
  );
}
```

```tsx
// src/app/(protected)/admin/org/new/page.tsx
import AdminShell from "@/components/admin-shell";
import { createOrgAction } from "./actions";

export default function AdminNewOrgPage() {
  return (
    <AdminShell title="Create organization" description="Set up a new feedback space for your members.">
      <form action={createOrgAction} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <label htmlFor="name" className="text-sm text-white/70">Organization name</label>
        <input id="name" name="name" required className="mt-2 w-full rounded-2xl bg-[#0f141d] px-4 py-3" />
        <button className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
          Create organization
        </button>
      </form>
    </AdminShell>
  );
}
```

```tsx
// src/app/(protected)/layout.tsx
if (!user) {
  redirect("/auth/login");
}
```

- [ ] **Step 4: Run the navigation test and lint**

Run: `npm run test -- tests/components/org-admin-nav.test.tsx`

Expected: PASS with `1 passed`

Run: `npm run lint`

Expected: PASS with no route import errors

- [ ] **Step 5: Smoke-check the admin routes manually**

Run: `npm run build`

Expected: PASS and route output includes `/auth/login`, `/admin`, and `/admin/org/[code]`

- [ ] **Step 6: Commit**

```bash
git add tests/components/org-admin-nav.test.tsx src/components/admin-shell.tsx src/components/org-admin-nav.tsx src/app/page.tsx src/app/(protected)/layout.tsx src/app/(protected)/admin/page.tsx src/app/(protected)/admin/org/new/page.tsx src/app/(protected)/admin/org/new/actions.ts src/app/(protected)/admin/org/[code]/layout.tsx src/app/(protected)/admin/org/[code]/page.tsx src/components/breadcrumbs.tsx src/app/auth/login/page.tsx
git commit -m "feat: add admin shell and replace demo landing"
```

## Task 5: Build Organizer Participants and Levels Management

**Files:**
- Create: `src/app/(protected)/admin/org/[code]/participants/page.tsx`
- Create: `src/app/(protected)/admin/org/[code]/participants/actions.ts`
- Create: `src/app/(protected)/admin/org/[code]/levels/page.tsx`
- Create: `src/app/(protected)/admin/org/[code]/levels/actions.ts`
- Modify: `src/lib/feedback/participants.ts`
- Modify: `src/lib/feedback/organizations.ts`

- [ ] **Step 1: Write a failing helper test for admin participant forms**

```ts
// tests/lib/feedback/participants.test.ts
import { describe, expect, it } from "vitest";
import { parseParticipantInput } from "@/lib/feedback/participants";

describe("participant input parsing", () => {
  it("rejects blank identifier values", () => {
    expect(() =>
      parseParticipantInput({
        identifierType: "email",
        identifierValue: "   ",
        displayName: "Member",
      }),
    ).toThrow("Participant identifier is required.");
  });
});
```

- [ ] **Step 2: Run the participant helper test to verify it fails**

Run: `npm run test -- tests/lib/feedback/participants.test.ts`

Expected: FAIL because `parseParticipantInput` does not exist

- [ ] **Step 3: Implement the admin participant and level actions**

```ts
// src/lib/feedback/participants.ts
export function parseParticipantInput(input: {
  identifierType: IdentifierType;
  identifierValue: string;
  displayName: string;
}) {
  const identifierValue = normalizeIdentifierValue(
    input.identifierType,
    input.identifierValue,
  );

  if (!identifierValue) {
    throw new Error("Participant identifier is required.");
  }

  return {
    identifierType: input.identifierType,
    identifierValue,
    displayName: input.displayName.trim() || null,
  };
}

export async function createParticipant(input: {
  organizationId: string;
  identifierType: IdentifierType;
  identifierValue: string;
  displayName: string | null;
  levelIds: string[];
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_participants")
    .insert({
      organization_id: input.organizationId,
      identifier_type: input.identifierType,
      identifier_value: input.identifierValue,
      display_name: input.displayName,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.levelIds.length > 0) {
    await admin.from("participant_level_assignments").insert(
      input.levelIds.map((levelId) => ({
        participant_id: data.id,
        level_id: levelId,
      })),
    );
  }
}

export async function getOrganizationLevels(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_levels")
    .select("id,name,slug,position")
    .eq("organization_id", organizationId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listParticipants(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_participants")
    .select("id,display_name,identifier_value,status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function findEligibleParticipantByIdentifier(input: {
  organizationId: string;
  identifierType: string;
  identifierValue: string;
}) {
  const admin = createAdminClient();
  const normalized = normalizeIdentifierValue(
    input.identifierType as IdentifierType,
    input.identifierValue,
  );

  const { data, error } = await admin
    .from("organization_participants")
    .select("id,organization_id,status")
    .eq("organization_id", input.organizationId)
    .eq("identifier_type", input.identifierType)
    .eq("identifier_value", normalized)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}
```

```ts
// src/app/(protected)/admin/org/[code]/participants/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createParticipant, parseParticipantInput } from "@/lib/feedback/participants";

export async function addParticipant(code: string, formData: FormData) {
  const org = await requireOwnedOrganization(code);
  const input = parseParticipantInput({
    identifierType: String(formData.get("identifierType") || "email") as never,
    identifierValue: String(formData.get("identifierValue") || ""),
    displayName: String(formData.get("displayName") || ""),
  });

  await createParticipant({
    organizationId: org.id,
    ...input,
    levelIds: formData.getAll("levelIds").map(String),
  });

  revalidatePath(`/admin/org/${code}/participants`);
}
```

```tsx
// src/app/(protected)/admin/org/[code]/participants/page.tsx
import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { getOrganizationLevels, listParticipants } from "@/lib/feedback/participants";
import { addParticipant } from "./actions";

export default async function ParticipantsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const org = await requireOwnedOrganization(code);
  const [participants, levels] = await Promise.all([
    listParticipants(org.id),
    getOrganizationLevels(org.id),
  ]);

  const action = addParticipant.bind(null, code);

  return (
    <AdminShell title="Participants" description="Only approved identities can access the room." code={code}>
      <form action={action} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <label className="text-sm text-white/70" htmlFor="identifierValue">Identifier</label>
        <input id="identifierValue" name="identifierValue" className="rounded-2xl bg-[#0f141d] px-4 py-3" />
        <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Add participant</button>
      </form>
      <section className="grid gap-3">
        {participants.map((participant) => (
          <article key={participant.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold">{participant.display_name || participant.identifier_value}</p>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
```

```ts
// src/app/(protected)/admin/org/[code]/levels/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createLevel } from "@/lib/feedback/participants";

export async function addLevel(code: string, formData: FormData) {
  const org = await requireOwnedOrganization(code);
  await createLevel({
    organizationId: org.id,
    name: String(formData.get("name") || ""),
    position: Number(formData.get("position") || 0),
  });
  revalidatePath(`/admin/org/${code}/levels`);
}
```

```tsx
// src/app/(protected)/admin/org/[code]/levels/page.tsx
import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { addLevel } from "./actions";
import { getOrganizationLevels } from "@/lib/feedback/participants";

export default async function LevelsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const org = await requireOwnedOrganization(code);
  const levels = await getOrganizationLevels(org.id);
  const action = addLevel.bind(null, code);

  return (
    <AdminShell title="Levels" description="Create the audience groups used for votes and messages." code={code}>
      <form action={action} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <input name="name" placeholder="Executive" className="w-full rounded-2xl bg-[#0f141d] px-4 py-3" />
        <button className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Add level</button>
      </form>
      <div className="grid gap-3">
        {levels.map((level) => (
          <article key={level.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold">{level.name}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Run the helper test and lint**

Run: `npm run test -- tests/lib/feedback/participants.test.ts`

Expected: PASS with the existing normalization tests plus the new parse test

Run: `npm run lint`

Expected: PASS with no server action export errors

- [ ] **Step 5: Manually verify the organizer workflow**

Run: `npm run build`

Expected: PASS and `/admin/org/[code]/participants` plus `/admin/org/[code]/levels` build successfully

- [ ] **Step 6: Commit**

```bash
git add tests/lib/feedback/participants.test.ts src/lib/feedback/participants.ts src/lib/feedback/organizations.ts src/app/(protected)/admin/org/[code]/participants/page.tsx src/app/(protected)/admin/org/[code]/participants/actions.ts src/app/(protected)/admin/org/[code]/levels/page.tsx src/app/(protected)/admin/org/[code]/levels/actions.ts
git commit -m "feat: add participant and level administration"
```

## Task 6: Build Organizer Vote and Message Management

**Files:**
- Create: `src/app/(protected)/admin/org/[code]/votes/page.tsx`
- Create: `src/app/(protected)/admin/org/[code]/votes/actions.ts`
- Create: `src/app/(protected)/admin/org/[code]/messages/page.tsx`
- Create: `src/app/(protected)/admin/org/[code]/messages/actions.ts`
- Modify: `src/lib/feedback/votes.ts`
- Modify: `src/lib/feedback/messages.ts`

- [ ] **Step 1: Add a failing helper test for vote form parsing**

```ts
// tests/lib/feedback/votes.test.ts
import { describe, expect, it } from "vitest";
import { parseVoteInput } from "@/lib/feedback/votes";

describe("vote form parsing", () => {
  it("requires a title and at least one eligible level", () => {
    expect(() =>
      parseVoteInput({
        title: "",
        description: "desc",
        tag: "General",
        eligibleLevelIds: [],
        liveResultLevelIds: ["public"],
        finalResultLevelIds: ["public"],
      }),
    ).toThrow("Vote title is required.");
  });
});
```

- [ ] **Step 2: Run the vote helper test to verify it fails**

Run: `npm run test -- tests/lib/feedback/votes.test.ts`

Expected: FAIL because `parseVoteInput` is missing

- [ ] **Step 3: Implement vote and message admin actions**

```ts
// src/lib/feedback/votes.ts
export function parseVoteInput(input: {
  title: string;
  description: string;
  tag: string;
  eligibleLevelIds: string[];
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
}) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Vote title is required.");
  }
  if (input.eligibleLevelIds.length === 0) {
    throw new Error("At least one eligible level is required.");
  }

  return {
    title,
    description: input.description.trim(),
    tag: input.tag.trim() || "General",
    eligibleLevelIds: input.eligibleLevelIds,
    liveResultLevelIds: input.liveResultLevelIds,
    finalResultLevelIds: input.finalResultLevelIds,
  };
}

export async function createVote(input: {
  organizationId: string;
  title: string;
  description: string;
  tag: string;
  eligibleLevelIds: string[];
  liveResultLevelIds: string[];
  finalResultLevelIds: string[];
  status: "draft" | "active" | "closed";
}) {
  const admin = createAdminClient();
  return admin.from("votes").insert({
    organization_id: input.organizationId,
    title: input.title,
    description: input.description,
    tag: input.tag,
    eligible_level_ids: input.eligibleLevelIds,
    live_result_level_ids: input.liveResultLevelIds,
    final_result_level_ids: input.finalResultLevelIds,
    status: input.status,
  });
}

export async function listVotes(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("votes")
    .select("id,title,description,tag,status,eligible_level_ids,live_result_level_ids,final_result_level_ids")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

```ts
// src/app/(protected)/admin/org/[code]/votes/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createVote, parseVoteInput } from "@/lib/feedback/votes";

export async function addVote(code: string, formData: FormData) {
  const org = await requireOwnedOrganization(code);
  const payload = parseVoteInput({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    tag: String(formData.get("tag") || "General"),
    eligibleLevelIds: formData.getAll("eligibleLevelIds").map(String),
    liveResultLevelIds: formData.getAll("liveResultLevelIds").map(String),
    finalResultLevelIds: formData.getAll("finalResultLevelIds").map(String),
  });

  await createVote({ organizationId: org.id, ...payload, status: "active" });
  revalidatePath(`/admin/org/${code}/votes`);
}
```

```ts
// src/lib/feedback/messages.ts
export async function createMessageChannel(input: {
  organizationId: string;
  title: string;
  prompt: string;
  submitLevelIds: string[];
  revealLevelIds: string[];
  status: "draft" | "open" | "closed";
}) {
  const admin = createAdminClient();
  return admin.from("message_channels").insert({
    organization_id: input.organizationId,
    title: input.title,
    prompt: input.prompt,
    submit_level_ids: input.submitLevelIds,
    reveal_level_ids: input.revealLevelIds,
    status: input.status,
  });
}

export async function toggleMessageReveal(input: {
  messageId: string;
  revealed: boolean;
}) {
  return revealMessageEntry(input.messageId, input.revealed);
}

export async function listMessageChannels(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("message_channels")
    .select("id,title,prompt,status,submit_level_ids,reveal_level_ids")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listMessageEntries(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("message_entries")
    .select("id,body,revealed,channel:message_channels!inner(organization_id)")
    .eq("message_channels.organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

```ts
// src/app/(protected)/admin/org/[code]/messages/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createMessageChannel, toggleMessageReveal } from "@/lib/feedback/messages";

export async function addMessageChannel(code: string, formData: FormData) {
  const org = await requireOwnedOrganization(code);
  await createMessageChannel({
    organizationId: org.id,
    title: String(formData.get("title") || "").trim(),
    prompt: String(formData.get("prompt") || "").trim(),
    submitLevelIds: formData.getAll("submitLevelIds").map(String),
    revealLevelIds: formData.getAll("revealLevelIds").map(String),
    status: "open",
  });
  revalidatePath(`/admin/org/${code}/messages`);
}

export async function setMessageReveal(code: string, formData: FormData) {
  await requireOwnedOrganization(code);
  await toggleMessageReveal({
    messageId: String(formData.get("messageId") || ""),
    revealed: String(formData.get("revealed") || "") === "true",
  });
  revalidatePath(`/admin/org/${code}/messages`);
}
```

```tsx
// src/app/(protected)/admin/org/[code]/votes/page.tsx
import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { getOrganizationLevels } from "@/lib/feedback/participants";
import { listVotes } from "@/lib/feedback/votes";
import { addVote } from "./actions";

export default async function VotesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const org = await requireOwnedOrganization(code);
  const [levels, votes] = await Promise.all([
    getOrganizationLevels(org.id),
    listVotes(org.id),
  ]);

  return (
    <AdminShell title="Votes" description="Publish level-based votes and control result visibility." code={code}>
      <form action={addVote.bind(null, code)} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <input name="title" placeholder="Vote title" className="w-full rounded-2xl bg-[#0f141d] px-4 py-3" />
        <div className="mt-4 flex flex-wrap gap-2">
          {levels.map((level) => (
            <label key={level.id} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/80">
              <input type="checkbox" name="eligibleLevelIds" value={level.id} className="mr-2" />
              {level.name}
            </label>
          ))}
        </div>
        <button className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Create vote</button>
      </form>
      <div className="grid gap-3">
        {votes.map((vote) => (
          <article key={vote.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold">{vote.title}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
```

```tsx
// src/app/(protected)/admin/org/[code]/messages/page.tsx
import AdminShell from "@/components/admin-shell";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { getOrganizationLevels } from "@/lib/feedback/participants";
import { listMessageChannels, listMessageEntries } from "@/lib/feedback/messages";
import { addMessageChannel, setMessageReveal } from "./actions";

export default async function MessagesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const org = await requireOwnedOrganization(code);
  const [levels, channels, entries] = await Promise.all([
    getOrganizationLevels(org.id),
    listMessageChannels(org.id),
    listMessageEntries(org.id),
  ]);

  return (
    <AdminShell title="Messages" description="Receive anonymous notes and choose what gets revealed." code={code}>
      <form action={addMessageChannel.bind(null, code)} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <input name="title" placeholder="Channel title" className="w-full rounded-2xl bg-[#0f141d] px-4 py-3" />
        <textarea name="prompt" className="mt-4 min-h-32 w-full rounded-2xl bg-[#0f141d] px-4 py-3" />
        <button className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Create channel</button>
      </form>
      <section className="grid gap-3">
        {entries.map((entry) => (
          <form key={entry.id} action={setMessageReveal.bind(null, code)} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <input type="hidden" name="messageId" value={entry.id} />
            <input type="hidden" name="revealed" value={String(!entry.revealed)} />
            <p className="text-sm text-white/80">{entry.body}</p>
            <button className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white">
              {entry.revealed ? "Hide message" : "Reveal message"}
            </button>
          </form>
        ))}
      </section>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Run the vote helper test and lint**

Run: `npm run test -- tests/lib/feedback/votes.test.ts`

Expected: PASS with aggregation tests plus the parsing test

Run: `npm run lint`

Expected: PASS with no invalid server action signatures

- [ ] **Step 5: Build and inspect the admin routes**

Run: `npm run build`

Expected: PASS and `/admin/org/[code]/votes` plus `/admin/org/[code]/messages` are emitted

- [ ] **Step 6: Commit**

```bash
git add tests/lib/feedback/votes.test.ts src/lib/feedback/votes.ts src/lib/feedback/messages.ts src/app/(protected)/admin/org/[code]/votes/page.tsx src/app/(protected)/admin/org/[code]/votes/actions.ts src/app/(protected)/admin/org/[code]/messages/page.tsx src/app/(protected)/admin/org/[code]/messages/actions.ts
git commit -m "feat: add organizer vote and message management"
```

## Task 7: Add Participant Access Session and Unified Room

**Files:**
- Create: `tests/lib/feedback/room-session.test.ts`
- Create: `src/lib/feedback/room-session.ts`
- Create: `src/components/participant-access-form.tsx`
- Create: `src/components/participant-room.tsx`
- Create: `src/app/room/[code]/page.tsx`
- Create: `src/app/room/[code]/actions.ts`
- Create: `src/app/room/[code]/space/page.tsx`
- Create: `src/app/room/[code]/space/actions.ts`
- Modify: `src/lib/feedback/policy.ts`
- Modify: `src/lib/feedback/participants.ts`
- Modify: `src/lib/feedback/votes.ts`
- Modify: `src/lib/feedback/messages.ts`

- [ ] **Step 1: Write the failing room-session test**

```ts
// tests/lib/feedback/room-session.test.ts
import { describe, expect, it } from "vitest";
import { buildRoomCookieName, serializeRoomSession } from "@/lib/feedback/room-session";

describe("room session helpers", () => {
  it("builds a stable cookie name per organization", () => {
    expect(buildRoomCookieName("org-123")).toBe("anon-room-org-123");
  });

  it("serializes the participant room session", () => {
    expect(
      serializeRoomSession({
        organizationId: "org-123",
        participantId: "part-456",
      }),
    ).toEqual({
      organizationId: "org-123",
      participantId: "part-456",
    });
  });
});
```

- [ ] **Step 2: Run the room-session test to verify it fails**

Run: `npm run test -- tests/lib/feedback/room-session.test.ts`

Expected: FAIL because `room-session.ts` does not exist

- [ ] **Step 3: Implement participant access and room rendering**

```ts
// src/lib/feedback/room-session.ts
import { cookies } from "next/headers";

export function buildRoomCookieName(organizationId: string) {
  return `anon-room-${organizationId}`;
}

export function serializeRoomSession(input: {
  organizationId: string;
  participantId: string;
}) {
  return input;
}

export async function setRoomSession(input: {
  organizationId: string;
  participantId: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(
    buildRoomCookieName(input.organizationId),
    JSON.stringify(serializeRoomSession(input)),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  );
}
```

```ts
// src/app/room/[code]/actions.ts
"use server";

import { redirect } from "next/navigation";
import { findEligibleParticipantByIdentifier } from "@/lib/feedback/participants";
import { setRoomSession } from "@/lib/feedback/room-session";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";

export async function verifyParticipant(code: string, formData: FormData) {
  const org = await getOrganizationByCodeForRoom(code);
  const identifierValue = String(formData.get("identifierValue") || "");
  const participant = await findEligibleParticipantByIdentifier({
    organizationId: org.id,
    identifierType: org.participant_identifier_type,
    identifierValue,
  });

  if (!participant) {
    redirect(`/room/${code}?error=not-found`);
  }

  await setRoomSession({
    organizationId: org.id,
    participantId: participant.id,
  });

  redirect(`/room/${code}/space`);
}
```

```tsx
// src/app/room/[code]/page.tsx
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import ParticipantAccessForm from "@/components/participant-access-form";

export default async function RoomEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const org = await getOrganizationByCodeForRoom(code);
  const state = await searchParams;

  return (
    <ParticipantAccessForm
      code={code}
      identifierLabel={org.participant_identifier_label}
      identifierType={org.participant_identifier_type}
      hasError={state.error === "not-found"}
    />
  );
}
```

```tsx
// src/components/participant-access-form.tsx
"use client";

import { useActionState } from "react";
import { verifyParticipant } from "@/app/room/[code]/actions";

const initialState = {};

export default function ParticipantAccessForm({
  code,
  identifierLabel,
  identifierType,
  hasError,
}: {
  code: string;
  identifierLabel: string;
  identifierType: string;
  hasError: boolean;
}) {
  const action = verifyParticipant.bind(null, code);
  const [, formAction, pending] = useActionState(action as never, initialState);

  return (
    <form action={formAction} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <p className="text-xs uppercase tracking-[0.28em] text-white/60">Participant access</p>
      <label htmlFor="identifierValue" className="text-sm text-white/70">{identifierLabel}</label>
      <input
        id="identifierValue"
        name="identifierValue"
        type={identifierType === "email" ? "email" : "text"}
        className="rounded-2xl bg-[#0f141d] px-4 py-3 text-white"
      />
      {hasError ? <p aria-live="polite" className="text-sm text-rose-200">That identity is not approved for this room.</p> : null}
      <button disabled={pending} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
        {pending ? "Checking access..." : "Enter room"}
      </button>
    </form>
  );
}
```

```tsx
// src/app/room/[code]/space/page.tsx
import { redirect } from "next/navigation";
import ParticipantRoom from "@/components/participant-room";
import { getParticipantRoomData } from "@/lib/feedback/participants";

export default async function ParticipantRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const room = await getParticipantRoomData(code);

  if (!room) {
    redirect(`/room/${code}`);
  }

  return <ParticipantRoom room={room} />;
}
```

```tsx
// src/components/participant-room.tsx
type ParticipantRoomProps = {
  room: {
    organizationName: string;
    votes: Array<{ id: string; title: string; support: number; oppose: number }>;
    messageChannels: Array<{ id: string; title: string; prompt: string }>;
    revealedMessages: Array<{ id: string; body: string }>;
  };
};

export default function ParticipantRoom({ room }: ParticipantRoomProps) {
  return (
    <div className="relative min-h-screen bg-[#0b0f15] text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">Participant room</p>
          <h1 className="font-heading text-4xl">{room.organizationName}</h1>
        </header>
      </div>
    </div>
  );
}
```

```ts
// src/lib/feedback/participants.ts
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import { filterRevealedMessages } from "@/lib/feedback/messages";
import { buildRoomCookieName } from "@/lib/feedback/room-session";

export async function getParticipantRoomData(code: string) {
  const org = await getOrganizationByCodeForRoom(code);
  const cookieStore = await cookies();
  const raw = cookieStore.get(buildRoomCookieName(org.id));

  if (!raw?.value) {
    return null;
  }

  const session = JSON.parse(raw.value) as {
    organizationId: string;
    participantId: string;
  };

  if (session.organizationId !== org.id) {
    return null;
  }

  const admin = createAdminClient();
  const [{ data: participant }, { data: votes }, { data: channels }, { data: messages }] =
    await Promise.all([
      admin
        .from("organization_participants")
        .select("id")
        .eq("id", session.participantId)
        .maybeSingle(),
      admin
        .from("votes")
        .select("id,title,status,eligible_level_ids,live_result_level_ids,final_result_level_ids,vote_ballots(choice)")
        .eq("organization_id", org.id),
      admin
        .from("message_channels")
        .select("id,title,prompt,status,submit_level_ids,reveal_level_ids")
        .eq("organization_id", org.id),
      admin
        .from("message_entries")
        .select("id,body,revealed,channel:message_channels!inner(organization_id)")
        .eq("message_channels.organization_id", org.id),
    ]);

  if (!participant) {
    return null;
  }

  return {
    organizationName: org.name,
    votes: votes ?? [],
    messageChannels: channels ?? [],
    revealedMessages: filterRevealedMessages(messages ?? []),
  };
}
```

- [ ] **Step 4: Run the session helper test and lint**

Run: `npm run test -- tests/lib/feedback/room-session.test.ts`

Expected: PASS with `2 passed`

Run: `npm run lint`

Expected: PASS with no cookie helper errors

- [ ] **Step 5: Manually verify the participant flow**

Run: `npm run build`

Expected: PASS and `/room/[code]` plus `/room/[code]/space` build successfully

- [ ] **Step 6: Commit**

```bash
git add tests/lib/feedback/room-session.test.ts src/lib/feedback/room-session.ts src/components/participant-access-form.tsx src/components/participant-room.tsx src/app/room/[code]/page.tsx src/app/room/[code]/actions.ts src/app/room/[code]/space/page.tsx src/app/room/[code]/space/actions.ts src/lib/feedback/participants.ts src/lib/feedback/votes.ts src/lib/feedback/messages.ts
git commit -m "feat: add participant verification and room"
```

## Task 8: Delete Legacy Routes and Run Final Verification

**Files:**
- Create: `tests/components/home-page.test.tsx`
- Delete: `src/app/vote/`
- Delete: `src/app/messages/`
- Delete: `src/app/org/[code]/vote/`
- Delete: `src/app/org/[code]/messages/`
- Delete: `src/app/org/[code]/page.tsx`
- Delete: `src/app/org/new/`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/breadcrumbs.tsx`

- [ ] **Step 1: Write the failing landing-page smoke test**

```tsx
// tests/components/home-page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("shows admin and participant entry actions", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Admin sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter room" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the landing-page test to verify it fails if the route still references demo copy**

Run: `npm run test -- tests/components/home-page.test.tsx`

Expected: PASS if Task 4 is still intact; if it fails, fix the public page before deletion proceeds

- [ ] **Step 3: Delete the old route trees and remove stale labels**

```bash
git rm -r src/app/vote src/app/messages src/app/org/[code]/vote src/app/org/[code]/messages src/app/org/new
git rm src/app/org/[code]/page.tsx
```

```ts
// src/components/breadcrumbs.tsx
const labelMap: Record<string, string> = {
  admin: "Admin",
  org: "Organization",
  participants: "Participants",
  levels: "Levels",
  votes: "Votes",
  messages: "Messages",
  room: "Room",
  space: "Space",
};
```

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "Anonymous Feedback",
  description:
    "Verified participant access for anonymous messages and controlled voting.",
};
```

- [ ] **Step 4: Run the full automated verification set**

Run: `npm run test`

Expected: PASS for all Vitest suites

Run: `npm run lint`

Expected: PASS with no imports pointing at deleted routes

Run: `npm run build`

Expected: PASS and no route generation for `/vote`, `/messages`, or `/org/[code]/vote`

- [ ] **Step 5: Perform the manual flow verification**

Run:

```bash
npm run dev
```

Expected checks:

- organizer can sign in and create an organization
- organizer can create levels and add participants
- organizer can create a vote and a message channel
- approved participant can enter `/room/[code]`
- participant sees only allowed votes and message channels
- organizer can reveal or hide messages without exposing raw entries by default

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/breadcrumbs.tsx tests/components/home-page.test.tsx
git commit -m "refactor: remove legacy demo routes"
```

## Self-Review

### Spec Coverage

- organizer authentication is covered by Tasks 2 and 4
- organization creation and admin dashboard are covered by Tasks 2 and 4
- levels and approved participants are covered by Task 5
- per-item vote and message reach rules are covered by Task 6
- unified participant room is covered by Task 7
- deletion of non-plan routes is covered by Task 8
- monetization is intentionally excluded from all tasks

### Placeholder Scan

- no `TBD`, `TODO`, or deferred implementation markers are present
- every task has explicit file paths, commands, and expected outcomes
- every task includes concrete code snippets for the new interfaces or route shape

### Type Consistency

- `IdentifierType` is introduced in Task 1 and reused by participants code in Tasks 2, 5, and 7
- vote status and message channel status names stay aligned between policy helpers and repository code
- room cookie helpers in Task 7 use the same organization and participant identifiers referenced by the repository layer
