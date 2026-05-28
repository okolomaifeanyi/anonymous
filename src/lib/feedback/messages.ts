import { canAccessAudience } from "@/lib/feedback/policy";
import type {
  MessageChannelStatus,
  MessageChannelRevealAudienceType,
  ParticipantRoomMessageChannel,
} from "@/lib/feedback/types";

type MessageEntry = {
  revealed: boolean;
};

export type OrganizationMessageChannel = {
  id: string;
  title: string;
  prompt: string;
  status: MessageChannelStatus;
  reveal_audience_type: MessageChannelRevealAudienceType;
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

export type AdminMessageEntry = OrganizationMessageEntry & {
  revealAudienceType: MessageChannelRevealAudienceType;
};

type MessageAdminQueryResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

type MessageAdminQuery<T = unknown> = {
  eq: (column: string, value: string) => MessageAdminQuery<T>;
  single: () => MessageAdminQueryResult<T>;
  maybeSingle: () => MessageAdminQueryResult<T>;
};

type MessageAdminClient = {
  from: (table: string) => {
    select: (columns: string) => MessageAdminQuery;
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
  participantId?: string;
};

type CreateMessageChannelInput = {
  organizationId: string;
  title: string;
  prompt: string;
  submitLevelIds: string[];
  revealAudienceType: MessageChannelRevealAudienceType;
  revealLevelIds: string[];
  revealParticipantIds: string[];
  status: MessageChannelStatus;
};

type ToggleMessageRevealInput = {
  messageId: string;
  organizationId: string;
  revealed: boolean;
  participantId?: string;
};

type DeleteMessageChannelInput = {
  organizationId: string;
  channelId: string;
};

type ParticipantRoomMessageChannelRow = {
  id: string;
  title: string;
  prompt: string;
  status: MessageChannelStatus;
  submit_level_ids: string[];
  reveal_level_ids: string[];
};

type ParticipantRoomRevealedMessageRow = {
  id: string;
  body: string;
  revealed: boolean;
  created_at: string;
  channel_id: string;
  message_channels:
    | {
        title: string;
        organization_id: string;
        reveal_audience_type: MessageChannelRevealAudienceType;
        reveal_level_ids: string[];
      }
    | {
        title: string;
        organization_id: string;
        reveal_audience_type: MessageChannelRevealAudienceType;
        reveal_level_ids: string[];
      }[]
    | null;
};

type MessageChannelRevealParticipantRow = {
  channel_id: string;
  participant_id: string;
};

type MessageChannelFeatureSupport = {
  revealAudienceType: boolean;
  revealParticipants: boolean;
};

type ParticipantMessageChannelAccessRow = {
  id: string;
  organization_id: string;
  status: MessageChannelStatus;
  submit_level_ids: string[];
};

type CreateParticipantMessageEntryInput = {
  organizationId: string;
  participantId: string;
  participantLevelIds: string[];
  channelId: string;
  body: string;
};

export type ParticipantRoomMessageChannelRecord =
  ParticipantRoomMessageChannel & {
    prompt: string;
  };

export type ParticipantRoomRevealedMessage = {
  id: string;
  body: string;
  revealed: boolean;
  createdAt: string;
  channelId: string;
  channelTitle: string;
  revealAudienceType: MessageChannelRevealAudienceType;
  revealLevelIds: string[];
  revealParticipantIds: string[];
};

export type ParticipantRoomPrivateMessage = ParticipantRoomRevealedMessage;

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
        reveal_audience_type: MessageChannelRevealAudienceType;
      }
    | {
        title: string;
        organization_id: string;
        reveal_audience_type: MessageChannelRevealAudienceType;
      }[]
    | null;
};

export function filterRevealedMessages<T extends MessageEntry>(messages: T[]) {
  return messages.filter((message) => message.revealed);
}

export function filterAdminVisibleMessageEntries(
  entries: AdminMessageEntry[],
) {
  return entries.filter(
    (entry) =>
      !(entry.revealAudienceType === "participants" && !entry.revealed),
  );
}

function normalizeLevelIds(levelIds: string[]) {
  return [...new Set(levelIds.map((value) => value.trim()).filter(Boolean))];
}

function normalizeParticipantIds(participantIds: string[]) {
  return [...new Set(participantIds.map((value) => value.trim()).filter(Boolean))];
}

export async function getMessageChannelFeatureSupport(): Promise<MessageChannelFeatureSupport> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  const [audienceSupport, participantSupport] = await Promise.allSettled([
    supabase
      .from("message_channels")
      .select("reveal_audience_type")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("message_channel_reveal_participants")
      .select("channel_id")
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    revealAudienceType:
      audienceSupport.status === "fulfilled" && !audienceSupport.value.error,
    revealParticipants:
      participantSupport.status === "fulfilled" &&
      !participantSupport.value.error,
  };
}

async function selectValidParticipantIds(
  organizationId: string,
  participantIds: string[],
) {
  const dedupedParticipantIds = normalizeParticipantIds(participantIds);

  if (dedupedParticipantIds.length === 0) {
    return dedupedParticipantIds;
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_participants")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("id", dedupedParticipantIds);

  if (error) {
    throw new Error(`Failed to validate reveal participants: ${error.message}`);
  }

  const validParticipantIds = new Set((data ?? []).map(({ id }) => id));

  if (validParticipantIds.size !== dedupedParticipantIds.length) {
    throw new Error("One or more selected participants are invalid.");
  }

  return dedupedParticipantIds;
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

async function selectMessageEntryDetails(
  supabase: MessageAdminClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("message_entries")
    .select("organization_id,channel_id")
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

  return data as { organization_id: string; channel_id: string };
}

async function selectMessageEntryChannelAudience(
  supabase: MessageAdminClient,
  channelId: string,
) {
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,organization_id,reveal_audience_type")
    .eq("id", channelId)
    .single();

  if (error) {
    throw new Error(
      `Failed to load message channel reveal audience: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Message channel not found.");
  }

  return data as {
    id: string;
    organization_id: string;
    reveal_audience_type: MessageChannelRevealAudienceType;
  };
}

async function selectMessageEntryRevealParticipant(
  supabase: MessageAdminClient,
  channelId: string,
  participantId: string,
) {
  const { data, error } = await supabase
    .from("message_channel_reveal_participants")
    .select("participant_id")
    .eq("channel_id", channelId)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to validate message reveal access: ${error.message}`,
    );
  }

  return data as { participant_id: string } | null;
}

export async function revealMessageEntry({
  id,
  organizationId,
  revealed,
  participantId,
}: RevealMessageEntryInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient() as unknown as MessageAdminClient;
  const messageEntryDetails = await selectMessageEntryDetails(
    supabase,
    id,
  );

  if (messageEntryDetails.organization_id !== organizationId) {
    throw new Error("Message entry must belong to the expected organization.");
  }

  const messageChannel = await selectMessageEntryChannelAudience(
    supabase,
    messageEntryDetails.channel_id,
  );

  if (messageChannel.organization_id !== organizationId) {
    throw new Error("Message channel must belong to the expected organization.");
  }

  if (messageChannel.reveal_audience_type === "participants") {
    if (!participantId) {
      throw new Error(
        "Participant-only messages are controlled by the selected participant.",
      );
    }

    const revealParticipant = await selectMessageEntryRevealParticipant(
      supabase,
      messageChannel.id,
      participantId,
    );

    if (!revealParticipant) {
      throw new Error("You are not allowed to reveal this message.");
    }
  } else if (participantId) {
    throw new Error(
      "Participant reveal is only available for participant-only messages.",
    );
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
  const featureSupport = await getMessageChannelFeatureSupport();
  const channel = parseMessageChannelInput(input);
  const revealParticipantIds =
    input.revealAudienceType === "participants"
      ? await selectValidParticipantIds(
          input.organizationId,
          input.revealParticipantIds,
        )
      : [];
  const revealLevelIds =
    input.revealAudienceType === "levels" ? channel.revealLevelIds : [];

  if (
    input.revealAudienceType === "participants" &&
    revealParticipantIds.length === 0
  ) {
    throw new Error("Select at least one participant for reveal access.");
  }

  if (input.revealAudienceType === "participants" && !featureSupport.revealParticipants) {
    throw new Error(
      "Participant-only reveal audiences require the updated message channel schema.",
    );
  }

  const insertValues = {
    organization_id: input.organizationId,
    title: channel.title,
    prompt: channel.prompt,
    submit_level_ids: channel.submitLevelIds,
    reveal_level_ids: revealLevelIds,
    status: input.status,
    ...(featureSupport.revealAudienceType
      ? { reveal_audience_type: input.revealAudienceType }
      : {}),
  };

  const { data, error } = await supabase
    .from("message_channels")
    .insert(insertValues)
    .select(
      featureSupport.revealAudienceType
        ? "id,title,prompt,status,reveal_audience_type,submit_level_ids,reveal_level_ids,created_at"
        : "id,title,prompt,status,submit_level_ids,reveal_level_ids,created_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to create message channel: ${error.message}`);
  }

  const insertedChannel = data as unknown as { id: string } | null;

  if (!insertedChannel) {
    throw new Error("Failed to create message channel.");
  }

  if (input.revealAudienceType === "participants" && revealParticipantIds.length > 0) {
    const { error: participantError } = await supabase
      .from("message_channel_reveal_participants")
      .insert(
        revealParticipantIds.map((participantId) => ({
          channel_id: insertedChannel.id,
          participant_id: participantId,
          organization_id: input.organizationId,
        })),
      );

    if (participantError) {
      await supabase
        .from("message_channels")
        .delete()
        .eq("id", insertedChannel.id)
        .eq("organization_id", input.organizationId);

      throw new Error(
        `Failed to save reveal participants: ${participantError.message}`,
      );
    }
  }

  return data as unknown as OrganizationMessageChannel;
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

export async function deleteMessageChannel({
  organizationId,
  channelId,
}: DeleteMessageChannelInput) {
  const trimmedChannelId = channelId.trim();

  if (!trimmedChannelId) {
    throw new Error("Message channel id is required.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,organization_id")
    .eq("id", trimmedChannelId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load message channel: ${error.message}`);
  }

  if (!data || data.organization_id !== organizationId) {
    throw new Error("Message channel not found for this organization.");
  }

  const { error: deleteError } = await supabase
    .from("message_channels")
    .delete()
    .eq("id", trimmedChannelId)
    .eq("organization_id", organizationId);

  if (deleteError) {
    throw new Error(`Failed to delete message channel: ${deleteError.message}`);
  }
}

export async function listMessageChannels(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const featureSupport = await getMessageChannelFeatureSupport();
  const { data, error } = await supabase
    .from("message_channels")
    .select(
      featureSupport.revealAudienceType
        ? "id,title,prompt,status,reveal_audience_type,submit_level_ids,reveal_level_ids,created_at"
        : "id,title,prompt,status,submit_level_ids,reveal_level_ids,created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load message channels: ${error.message}`);
  }
  return ((data ?? []) as unknown as OrganizationMessageChannel[]).map((channel) => ({
    ...channel,
    reveal_audience_type: channel.reveal_audience_type ?? "levels",
  }));
}

export async function listMessageChannelRevealParticipants(organizationId: string) {
  const featureSupport = await getMessageChannelFeatureSupport();

  if (!featureSupport.revealParticipants) {
    return [];
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channel_reveal_participants")
    .select("channel_id,participant_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load message channel reveal participants: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as MessageChannelRevealParticipantRow[];
}

export async function listMessageEntries(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_entries")
    .select(
      "id,channel_id,participant_id,body,revealed,created_at,message_channels!message_entries_channel_id_organization_id_fkey!inner(title,organization_id)",
    )
    .eq("message_channels.organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load message entries: ${error.message}`);
  }

  return ((data ?? []) as unknown as MessageEntryRow[]).map((entry) => {
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

export async function listParticipantRoomMessageChannels(
  organizationId: string,
) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,title,prompt,status,submit_level_ids,reveal_level_ids")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load participant room message channels: ${error.message}`,
    );
  }

  return ((data ?? []) as unknown as ParticipantRoomMessageChannelRow[]).map((channel) => ({
    id: channel.id,
    title: channel.title,
    prompt: channel.prompt,
    status: channel.status,
    submitLevelIds: channel.submit_level_ids ?? [],
    revealLevelIds: channel.reveal_level_ids ?? [],
  }));
}

export async function listParticipantRoomRevealedMessages(
  organizationId: string,
) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const featureSupport = await getMessageChannelFeatureSupport();
  const [{ data, error }, revealParticipants] = await Promise.all([
    supabase
      .from("message_entries")
      .select(
        featureSupport.revealAudienceType
          ? "id,body,revealed,created_at,channel_id,message_channels!message_entries_channel_id_organization_id_fkey!inner(title,organization_id,reveal_audience_type,reveal_level_ids)"
          : "id,body,revealed,created_at,channel_id,message_channels!message_entries_channel_id_organization_id_fkey!inner(title,organization_id,reveal_level_ids)",
      )
      .eq("organization_id", organizationId)
      .eq("revealed", true)
      .order("created_at", { ascending: false }),
    listMessageChannelRevealParticipants(organizationId),
  ]);

  if (error) {
    throw new Error(
      `Failed to load participant room revealed messages: ${error.message}`,
    );
  }

  const revealParticipantIdsByChannel = new Map<string, string[]>();

  for (const row of revealParticipants) {
    const participantIds = revealParticipantIdsByChannel.get(row.channel_id) ?? [];
    participantIds.push(row.participant_id);
    revealParticipantIdsByChannel.set(row.channel_id, participantIds);
  }

  return ((data ?? []) as unknown as ParticipantRoomRevealedMessageRow[]).map((message) => {
    const channel = Array.isArray(message.message_channels)
      ? message.message_channels[0]
      : message.message_channels;

    return {
      id: message.id,
      body: message.body,
      revealed: message.revealed,
      createdAt: message.created_at,
      channelId: message.channel_id,
      channelTitle: channel?.title ?? "Untitled channel",
      revealAudienceType: channel?.reveal_audience_type ?? "levels",
      revealLevelIds: channel?.reveal_level_ids ?? [],
      revealParticipantIds: revealParticipantIdsByChannel.get(message.channel_id) ?? [],
    } satisfies ParticipantRoomRevealedMessage;
  });
}

export async function listParticipantRoomPrivateMessages(
  organizationId: string,
  participantId: string,
) {
  const featureSupport = await getMessageChannelFeatureSupport();

  if (!featureSupport.revealParticipants) {
    return [];
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const [{ data, error }, revealParticipants] = await Promise.all([
    supabase
      .from("message_entries")
      .select(
        featureSupport.revealAudienceType
          ? "id,body,revealed,created_at,channel_id,message_channels!message_entries_channel_id_organization_id_fkey!inner(title,organization_id,reveal_audience_type,reveal_level_ids)"
          : "id,body,revealed,created_at,channel_id,message_channels!message_entries_channel_id_organization_id_fkey!inner(title,organization_id,reveal_level_ids)",
      )
      .eq("organization_id", organizationId)
      .eq("revealed", false)
      .order("created_at", { ascending: false }),
    listMessageChannelRevealParticipants(organizationId),
  ]);

  if (error) {
    throw new Error(
      `Failed to load participant room private messages: ${error.message}`,
    );
  }

  const revealParticipantIdsByChannel = new Map<string, string[]>();

  for (const row of revealParticipants) {
    const participantIds =
      revealParticipantIdsByChannel.get(row.channel_id) ?? [];
    participantIds.push(row.participant_id);
    revealParticipantIdsByChannel.set(row.channel_id, participantIds);
  }

  return ((data ?? []) as unknown as ParticipantRoomRevealedMessageRow[])
    .map((message) => {
      const channel = Array.isArray(message.message_channels)
        ? message.message_channels[0]
        : message.message_channels;

      return {
        id: message.id,
        body: message.body,
        revealed: message.revealed,
        createdAt: message.created_at,
        channelId: message.channel_id,
        channelTitle: channel?.title ?? "Untitled channel",
        revealAudienceType: channel?.reveal_audience_type ?? "levels",
        revealLevelIds: channel?.reveal_level_ids ?? [],
        revealParticipantIds:
          revealParticipantIdsByChannel.get(message.channel_id) ?? [],
      } satisfies ParticipantRoomPrivateMessage;
    })
    .filter(
      (message) =>
        message.revealAudienceType === "participants" &&
        message.revealParticipantIds.includes(participantId),
    );
}

export async function createParticipantMessageEntry({
  organizationId,
  participantId,
  participantLevelIds,
  channelId,
  body,
}: CreateParticipantMessageEntryInput) {
  const trimmedChannelId = channelId.trim();
  const trimmedBody = body.trim();

  if (!trimmedChannelId) {
    throw new Error("Message channel id is required.");
  }

  if (!trimmedBody) {
    throw new Error("Write a message before you submit.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_channels")
    .select("id,organization_id,status,submit_level_ids")
    .eq("id", trimmedChannelId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load message channel: ${error.message}`);
  }

  const channel = data as unknown as ParticipantMessageChannelAccessRow | null;

  if (!channel || channel.organization_id !== organizationId) {
    throw new Error("Message channel not found for this room.");
  }

  if (channel.status !== "open") {
    throw new Error("This message channel is closed right now.");
  }

  if (!canAccessAudience(participantLevelIds, channel.submit_level_ids ?? [])) {
    throw new Error("You do not have access to submit to this channel.");
  }

  const { data: entry, error: insertError } = await supabase
    .from("message_entries")
    .insert({
      channel_id: trimmedChannelId,
      participant_id: participantId,
      organization_id: organizationId,
      body: trimmedBody,
      revealed: false,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `Failed to create participant message entry: ${insertError.message}`,
    );
  }

  return entry;
}

export default filterRevealedMessages;
