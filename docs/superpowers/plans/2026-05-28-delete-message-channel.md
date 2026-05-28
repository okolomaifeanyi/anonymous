# Delete Message Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hard-delete flow for message channels that permanently deletes the channel, its messages, and its reveal-audience assignments.

**Architecture:** Reuse the existing server-action pattern used for message visibility changes. The admin messages page will render one destructive delete form per channel, and the server action will verify ownership, delete the channel row, and rely on existing foreign-key cascade rules to remove dependent `message_entries` and `message_channel_reveal_participants` rows. The UI will redirect back to the messages page with a status message after revalidation.

**Tech Stack:** Next.js App Router server actions, Supabase admin client, Vitest, existing Tailwind/shadcn-based admin UI.

---

### Task 1: Add delete server action

**Files:**
- Modify: `src/app/(protected)/admin/org/[code]/messages/actions.ts`
- Test: `tests/lib/feedback/messages.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { deleteMessageChannel } from "@/app/(protected)/admin/org/[code]/messages/actions";

it("deletes a message channel and revalidates the messages page", async () => {
  const organization = { id: "org-1", code: "team-pulse" };
  const channelLookup = {
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id: "channel-1", organization_id: "org-1" },
      error: null,
    }),
  };
  const deleteQuery = {
    eq: vi.fn().mockReturnThis(),
  };
  deleteQuery.eq.mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "message_channels") {
      return {
        select: vi.fn(() => channelLookup),
        delete: vi.fn(() => deleteQuery),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  vi.mocked(requireOwnedOrganization).mockResolvedValue(organization as never);
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);

  await expect(
    deleteMessageChannel("team-pulse", new FormData([["channelId", "channel-1"]])),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/feedback/messages.test.ts`
Expected: FAIL because `deleteMessageChannel` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export async function deleteMessageChannel(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);
  const channelId = String(formData.get("channelId") ?? "").trim();

  if (!channelId) {
    throw new Error("Message channel id is required.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,organization_id")
    .eq("id", channelId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load message channel: ${error.message}`);
  }

  if (!data || data.organization_id !== organization.id) {
    throw new Error("Message channel not found for this organization.");
  }

  const { error: deleteError } = await supabase
    .from("message_channels")
    .delete()
    .eq("id", channelId)
    .eq("organization_id", organization.id);

  if (deleteError) {
    throw new Error(`Failed to delete message channel: ${deleteError.message}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/feedback/messages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/admin/org/[code]/messages/actions.ts tests/lib/feedback/messages.test.ts
git commit -m "feat: add message channel delete action"
```

### Task 2: Add delete button to the channel card

**Files:**
- Modify: `src/app/(protected)/admin/org/[code]/messages/page.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// Add a snapshot/assertion for a destructive form button on each channel card.
// The rendered output should include a form that posts the channel id to the
// delete action and labels the control "Delete channel".
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/app/admin-messages-page.test.tsx`
Expected: FAIL because the delete control is not rendered yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
const deleteChannelAction = deleteMessageChannel.bind(null, code);

<form action={deleteChannelAction}>
  <input type="hidden" name="channelId" value={channel.id} />
  <button
    type="submit"
    className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
    onClick={(event) => {
      if (!window.confirm("Delete this channel and all of its entries?")) {
        event.preventDefault();
      }
    }}
  >
    Delete channel
  </button>
</form>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/app/admin-messages-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/admin/org/[code]/messages/page.tsx
git commit -m "feat: add delete channel control"
```

### Task 3: Validate cascade behavior and user feedback

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/app/(protected)/admin/org/[code]/messages/actions.ts`
- Modify: `tests/lib/feedback/messages.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("returns a success redirect after deleting a channel", async () => {
  // mock createAdminClient, requireOwnedOrganization, and revalidatePath
  // assert the action redirects to /admin/org/team-pulse/messages?status=channel-deleted
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/feedback/messages.test.ts`
Expected: FAIL until redirect/revalidation behavior is implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
revalidatePath(`/admin/org/${code}/messages`);
redirect(buildMessagesPath(code, { status: "channel-deleted" }));
```

If the schema still lacks the delete cascade constraints, add them explicitly:

```sql
alter table public.message_entries
  drop constraint if exists message_entries_channel_id_organization_id_fkey;

alter table public.message_entries
  add constraint message_entries_channel_id_organization_id_fkey
  foreign key (channel_id, organization_id)
  references public.message_channels(id, organization_id)
  on delete cascade;

alter table public.message_channel_reveal_participants
  drop constraint if exists message_channel_reveal_participants_channel_id_organization_id_fkey;

alter table public.message_channel_reveal_participants
  add constraint message_channel_reveal_participants_channel_id_organization_id_fkey
  foreign key (channel_id, organization_id)
  references public.message_channels(id, organization_id)
  on delete cascade;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/feedback/messages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/app/(protected)/admin/org/[code]/messages/actions.ts tests/lib/feedback/messages.test.ts
git commit -m "fix: cascade delete message channels"
```

### Task 4: Full verification

**Files:**
- None

- [ ] **Step 1: Run focused tests**

Run: `npm run test -- tests/lib/feedback/messages.test.ts tests/lib/feedback/policy.test.ts`
Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit final state**

```bash
git add src/app/(protected)/admin/org/[code]/messages/page.tsx src/app/(protected)/admin/org/[code]/messages/actions.ts src/lib/feedback/messages.ts src/components/message-channel-form.tsx tests/lib/feedback/messages.test.ts supabase/schema.sql
git commit -m "feat: delete message channels"
```
