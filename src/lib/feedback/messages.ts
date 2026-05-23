import type { MessageChannelStatus } from "@/lib/feedback/types";

type MessageEntry = {
  revealed: boolean;
};

export type OrganizationMessageChannel = {
  id: string;
  title: string;
  prompt: string;
  status: MessageChannelStatus;
  submit_level_ids: string[];
  reveal_level_ids: string[];
  created_at: string;
};

export type OrganizationMessageEntry = {
  id: string;
  channel_id: string;
  participant_id: string;
  body: string;
  revealed: boolean;
  created_at: string;
  channel_title: string;
};

type MessageOrganizationLookup = {
  organization_id: string;
};

type MessageAdminClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: MessageOrganizationLookup | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (values: { revealed: boolean }) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: {
                id: string;
                organization_id: string;
                channel_id: string;
                participant_id: string;
                body: string;
                revealed: boolean;
                created_at: string;
              } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
};

type RevealMessageEntryInput = {
  id: string;
  organizationId: string;
  revealed: boolean;
};

type CreateMessageChannelInput = {
  organizationId: string;
  title: string;
  prompt: string;
  submitLevelIds: string[];
  revealLevelIds: string[];
  status: MessageChannelStatus;
};

type ToggleMessageRevealInput = {
  messageId: string;
  organizationId: string;
  revealed: boolean;
};

type MessageEntryRow = {
  id: string;
  channel_id: string;
  participant_id: string;
  body: string;
  revealed: boolean;
  created_at: string;
  message_channels:
    | {
        title: string;
        organization_id: string;
      }
    | {
        title: string;
        organization_id: string;
      }[]
    | null;
};

export function filterRevealedMessages<T extends MessageEntry>(messages: T[]) {
  return messages.filter((message) => message.revealed);
}

function normalizeLevelIds(levelIds: string[]) {
  return [...new Set(levelIds.map((value) => value.trim()).filter(Boolean))];
}

function parseMessageChannelInput(input: CreateMessageChannelInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Channel title is required.");
  }

  const prompt = input.prompt.trim();

  if (!prompt) {
    throw new Error("Channel prompt is required.");
  }

  const submitLevelIds = normalizeLevelIds(input.submitLevelIds);

  if (submitLevelIds.length === 0) {
    throw new Error("At least one submit level is required.");
  }

  return {
    title,
    prompt,
    submitLevelIds,
    revealLevelIds: normalizeLevelIds(input.revealLevelIds),
  };
}

async function selectMessageEntryOrganizationId(
  supabase: MessageAdminClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("message_entries")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `Failed to load message entry organization: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Message entry not found.");
  }

  return data.organization_id;
}

export async function revealMessageEntry({
  id,
  organizationId,
  revealed,
}: RevealMessageEntryInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient() as unknown as MessageAdminClient;
  const messageOrganizationId = await selectMessageEntryOrganizationId(
    supabase,
    id,
  );

  if (messageOrganizationId !== organizationId) {
    throw new Error("Message entry must belong to the expected organization.");
  }

  const { data, error } = await supabase
    .from("message_entries")
    .update({ revealed })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("id,organization_id,channel_id,participant_id,body,revealed,created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update message entry reveal state: ${error.message}`);
  }

  return data;
}

export async function createMessageChannel(input: CreateMessageChannelInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const channel = parseMessageChannelInput(input);
  const { data, error } = await supabase
    .from("message_channels")
    .insert({
      organization_id: input.organizationId,
      title: channel.title,
      prompt: channel.prompt,
      submit_level_ids: channel.submitLevelIds,
      reveal_level_ids: channel.revealLevelIds,
      status: input.status,
    })
    .select("id,title,prompt,status,submit_level_ids,reveal_level_ids,created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create message channel: ${error.message}`);
  }

  return data as OrganizationMessageChannel;
}

export async function toggleMessageReveal({
  messageId,
  organizationId,
  revealed,
}: ToggleMessageRevealInput) {
  const id = messageId.trim();

  if (!id) {
    throw new Error("Message entry id is required.");
  }

  return revealMessageEntry({
    id,
    organizationId,
    revealed,
  });
}

export async function listMessageChannels(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,title,prompt,status,submit_level_ids,reveal_level_ids,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load message channels: ${error.message}`);
  }

  return (data ?? []) as OrganizationMessageChannel[];
}

export async function listMessageEntries(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_entries")
    .select(
      "id,channel_id,participant_id,body,revealed,created_at,message_channels!inner(title,organization_id)",
    )
    .eq("message_channels.organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load message entries: ${error.message}`);
  }

  return ((data ?? []) as MessageEntryRow[]).map((entry) => {
    const channel = Array.isArray(entry.message_channels)
      ? entry.message_channels[0]
      : entry.message_channels;

    return {
      id: entry.id,
      channel_id: entry.channel_id,
      participant_id: entry.participant_id,
      body: entry.body,
      revealed: entry.revealed,
      created_at: entry.created_at,
      channel_title: channel?.title ?? "Untitled channel",
    };
  });
}

export default filterRevealedMessages;
