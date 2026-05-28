# Message Channel Selected Participant Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new per-channel reveal audience mode that lets admins choose approved participants who can view revealed messages, without changing existing level-based reveal behavior.

**Architecture:** Keep `message_channels` as the source of channel metadata and add a separate allowlist table for selected-participant reveal access. Preserve the current `reveal_level_ids` flow for existing channels, and extend the admin message channel form plus participant-room visibility checks to honor either reveal mode. Use repository helpers for loading and validating channel audiences so UI components stay thin.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, server actions, Tailwind CSS, Vitest

---

### Task 1: Add reveal-audience storage

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Add the new channel reveal mode schema**

```sql
alter table public.message_channels
  add column if not exists reveal_audience_type text not null default 'levels';

create table if not exists public.message_channel_reveal_participants (
  channel_id uuid not null references public.message_channels(id) on delete cascade,
  participant_id uuid not null references public.organization_participants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel_id, participant_id)
);
```

- [ ] **Step 2: Add RLS and integrity rules**

```sql
alter table public.message_channel_reveal_participants enable row level security;

alter table public.message_channel_reveal_participants
  add constraint message_channel_reveal_participants_channel_id_organization_id_fkey
  foreign key (channel_id, organization_id)
  references public.message_channels(id, organization_id)
  on delete cascade;

alter table public.message_channel_reveal_participants
  add constraint message_channel_reveal_participants_participant_id_organization_id_fkey
  foreign key (participant_id, organization_id)
  references public.organization_participants(id, organization_id)
  on delete cascade;
```

### Task 2: Extend message channel helpers

**Files:**
- Modify: `src/lib/feedback/messages.ts`
- Modify: `src/lib/feedback/policy.ts`
- Modify: `src/lib/feedback/participants.ts`

- [ ] **Step 1: Add a failing helper test**

```ts
// tests/lib/feedback/messages.test.ts
import { describe, expect, it } from "vitest";
import { canSeeRevealedMessageForChannel } from "@/lib/feedback/policy";

describe("channel reveal audience", () => {
  it("allows only explicitly selected participants when the channel uses participant reveal mode", () => {
    expect(
      canSeeRevealedMessageForChannel({
        participantId: "participant-1",
        participantLevelIds: ["public"],
        channel: {
          revealAudienceType: "participants",
          revealLevelIds: [],
          revealParticipantIds: ["participant-1"],
        },
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Implement the new reveal audience helpers**

```ts
export type MessageChannelRevealAudienceType = "levels" | "participants";
export function canSeeRevealedMessageForChannel(...) { ... }
export async function listMessageChannelRevealParticipants(channelIds: string[]) { ... }
export async function setMessageChannelRevealParticipants(...) { ... }
```

- [ ] **Step 3: Update participant-room filtering**

```ts
const visibleMessages = filterParticipantRoomMessages(
  context.participant.id,
  context.participant.levelIds,
  revealedMessages,
);
```

### Task 3: Wire the admin message form

**Files:**
- Modify: `src/app/(protected)/admin/org/[code]/messages/page.tsx`
- Modify: `src/app/(protected)/admin/org/[code]/messages/actions.ts`

- [ ] **Step 1: Add reveal audience controls to the form**

```tsx
<fieldset>
  <legend className="text-sm font-medium text-white/80">Reveal audience</legend>
  <label>
    <input type="radio" name="revealAudienceType" value="levels" defaultChecked />
    Selected levels
  </label>
  <label>
    <input type="radio" name="revealAudienceType" value="participants" />
    Selected participants
  </label>
</fieldset>
```

- [ ] **Step 2: Render approved participants for selection**

```tsx
<fieldset>
  {participants.map((participant) => (
    <label key={participant.id}>
      <input type="checkbox" name="revealParticipantIds" value={participant.id} />
      {participant.display_name ?? participant.identifier_value}
    </label>
  ))}
</fieldset>
```

- [ ] **Step 3: Persist the chosen audience mode and participants**

```ts
await createMessageChannel({
  ...,
  revealAudienceType,
  revealLevelIds,
  revealParticipantIds,
});
```

### Task 4: Verify the flow

**Files:**
- Add: `tests/lib/feedback/messages.test.ts`
- Modify: existing tests if needed

- [ ] **Step 1: Add regression coverage for level and participant reveal modes**

- [ ] **Step 2: Run targeted tests**

Run: `npm run test -- tests/lib/feedback/messages.test.ts tests/lib/feedback/policy.test.ts`
Expected: PASS

- [ ] **Step 3: Run lint and build**

Run: `npm run lint`
Run: `npm run build`
Expected: PASS
