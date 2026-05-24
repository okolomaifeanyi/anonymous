import type { IdentifierType } from "@/lib/feedback/types";
import { filterRevealedMessages, listParticipantRoomMessageChannels, listParticipantRoomRevealedMessages, type ParticipantRoomMessageChannelRecord, type ParticipantRoomRevealedMessage } from "@/lib/feedback/messages";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import {
  canSeeRevealedMessages,
  canSeeVoteResults,
  getParticipantRoomAccessSummary,
  getVisibleParticipantRoomSections,
} from "@/lib/feedback/policy";
import { getRoomSession } from "@/lib/feedback/room-session";
import {
  listParticipantRoomVotes,
  type ParticipantRoomVoteRecord,
} from "@/lib/feedback/votes";

type CreateLevelInput = {
  organizationId: string;
  name: string;
  position: number;
};

type CreateParticipantInput = {
  organizationId: string;
  identifierType: IdentifierType;
  identifierValue: string;
  displayName: string | null;
  levelIds: string[];
};

type AdminError = {
  code?: string;
  message: string;
};

export type OrganizationLevel = {
  id: string;
  name: string;
  slug: string;
  position: number;
  created_at: string;
};

export type OrganizationParticipant = {
  id: string;
  identifier_type: IdentifierType;
  identifier_value: string;
  display_name: string | null;
  status: string;
  created_at: string;
  levels: OrganizationLevel[];
};

type ParticipantLevelAssignmentRow = {
  participant_id: string;
  organization_levels:
    | {
        id: string;
        name: string;
        slug: string;
        position: number;
        created_at?: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
        position: number;
        created_at?: string;
      }[]
    | null;
};

type ParticipantRoomLevelAssignmentRow = {
  organization_levels:
    | {
        id: string;
      }
    | {
        id: string;
      }[]
    | null;
};

type ParticipantRoomParticipantRow = {
  id: string;
  display_name: string | null;
  status: string;
};

type ParticipantRoomContextParticipant = {
  id: string;
  displayName: string | null;
  levelIds: string[];
};

export type ParticipantRoomContext = {
  organization: Awaited<ReturnType<typeof getOrganizationByCodeForRoom>>;
  participant: ParticipantRoomContextParticipant;
};

export type ParticipantRoomData = {
  organizationCode: string;
  organizationName: string;
  participantDisplayName: string | null;
  votes: Array<
    ParticipantRoomVoteRecord & {
      canSeeResults: boolean;
    }
  >;
  messageChannels: ParticipantRoomMessageChannelRecord[];
  revealedMessages: ParticipantRoomRevealedMessage[];
  accessSummary: ReturnType<typeof getParticipantRoomAccessSummary>;
};

export function normalizeIdentifierValue(
  type: IdentifierType,
  value: string,
) {
  const trimmed = value.trim();

  if (type === "email") {
    return trimmed.toLowerCase();
  }

  if (type === "phone") {
    return trimmed.replace(/[^\d+]/g, "");
  }

  return trimmed;
}

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

  const displayName = input.displayName.trim();

  return {
    identifierType: input.identifierType,
    identifierValue,
    displayName: displayName || null,
  };
}

export function slugifyLevelName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDuplicateErrorMessage(
  error: AdminError | null,
  constraintName: string,
  fallbackMessage: string,
) {
  if (!error) {
    return null;
  }

  if (error.code === "23505" || error.message.includes(constraintName)) {
    return fallbackMessage;
  }

  return null;
}

function parseLevelName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Level name is required.");
  }

  return trimmed;
}

export async function createLevel({
  organizationId,
  name,
  position,
}: CreateLevelInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const trimmedName = parseLevelName(name);
  const slug = slugifyLevelName(trimmedName);

  if (!slug) {
    throw new Error("Level name is required.");
  }

  const { data, error } = await supabase
    .from("organization_levels")
    .insert({
      organization_id: organizationId,
      name: trimmedName,
      slug,
      position,
    })
    .select("id,organization_id,name,slug,position,created_at")
    .single();

  if (error) {
    const duplicateMessage = getDuplicateErrorMessage(
      error,
      "organization_levels_organization_id_slug_key",
      "A level with this name already exists.",
    );

    if (duplicateMessage) {
      throw new Error(duplicateMessage);
    }

    throw new Error(`Failed to create organization level: ${error.message}`);
  }

  return data;
}

export async function getOrganizationLevels(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_levels")
    .select("id,name,slug,position,created_at")
    .eq("organization_id", organizationId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load organization levels: ${error.message}`);
  }

  return (data ?? []) as OrganizationLevel[];
}

async function selectValidLevelIds(
  organizationId: string,
  levelIds: string[],
) {
  const dedupedLevelIds = [...new Set(levelIds.map((value) => value.trim()))]
    .filter(Boolean);

  if (dedupedLevelIds.length === 0) {
    return dedupedLevelIds;
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_levels")
    .select("id")
    .eq("organization_id", organizationId)
    .in("id", dedupedLevelIds);

  if (error) {
    throw new Error(`Failed to validate participant levels: ${error.message}`);
  }

  const validLevelIds = new Set((data ?? []).map(({ id }) => id));

  if (validLevelIds.size !== dedupedLevelIds.length) {
    throw new Error("One or more selected levels are invalid.");
  }

  return dedupedLevelIds;
}

export async function createParticipant({
  organizationId,
  identifierType,
  identifierValue,
  displayName,
  levelIds,
}: CreateParticipantInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const validLevelIds = await selectValidLevelIds(organizationId, levelIds);
  const { data, error } = await supabase
    .from("organization_participants")
    .insert({
      organization_id: organizationId,
      identifier_type: identifierType,
      identifier_value: identifierValue,
      display_name: displayName,
      status: "active",
    })
    .select("id,organization_id,identifier_type,identifier_value,display_name,status,created_at")
    .single();

  if (error) {
    const duplicateMessage = getDuplicateErrorMessage(
      error,
      "organization_participants_organization_id_identifier_type_identifier_value_key",
      "A participant with this identifier already exists.",
    );

    if (duplicateMessage) {
      throw new Error(duplicateMessage);
    }

    throw new Error(`Failed to create participant: ${error.message}`);
  }

  if (validLevelIds.length === 0) {
    return data;
  }

  const { error: assignmentError } = await supabase
    .from("participant_level_assignments")
    .insert(
      validLevelIds.map((levelId) => ({
        participant_id: data.id,
        level_id: levelId,
      })),
    );

  if (assignmentError) {
    const { error: rollbackError } = await supabase
      .from("organization_participants")
      .delete()
      .eq("id", data.id);

    if (rollbackError) {
      console.error(
        "Participant rollback failed after level assignment error:",
        rollbackError,
      );
    }

    throw new Error(
      `Failed to assign participant levels: ${assignmentError.message}`,
    );
  }

  return data;
}

export async function listParticipants(organizationId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_participants")
    .select(
      "id,identifier_type,identifier_value,display_name,status,created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load participants: ${error.message}`);
  }

  const participants = (data ?? []) as Omit<OrganizationParticipant, "levels">[];

  if (participants.length === 0) {
    return participants.map((participant) => ({ ...participant, levels: [] }));
  }

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("participant_level_assignments")
    .select(
      "participant_id,organization_levels(id,name,slug,position,created_at)",
    )
    .in(
      "participant_id",
      participants.map(({ id }) => id),
    );

  if (assignmentError) {
    throw new Error(
      `Failed to load participant level assignments: ${assignmentError.message}`,
    );
  }

  const levelsByParticipant = new Map<string, OrganizationLevel[]>();

  for (const assignment of (assignmentData ?? []) as ParticipantLevelAssignmentRow[]) {
    const joinedLevel = Array.isArray(assignment.organization_levels)
      ? assignment.organization_levels[0]
      : assignment.organization_levels;

    if (!joinedLevel) {
      continue;
    }

    const levels = levelsByParticipant.get(assignment.participant_id) ?? [];
    levels.push({
      ...joinedLevel,
      created_at: joinedLevel.created_at ?? "",
    });
    levelsByParticipant.set(assignment.participant_id, levels);
  }

  return participants.map((participant) => ({
    ...participant,
    levels: (levelsByParticipant.get(participant.id) ?? []).sort(
      (left, right) => left.position - right.position,
    ),
  }));
}

export async function findEligibleParticipantByIdentifier(input: {
  organizationId: string;
  identifierType: IdentifierType;
  identifierValue: string;
}) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const normalizedValue = normalizeIdentifierValue(
    input.identifierType,
    input.identifierValue,
  );
  const { data, error } = await supabase
    .from("organization_participants")
    .select("id,organization_id,status")
    .eq("organization_id", input.organizationId)
    .eq("identifier_type", input.identifierType)
    .eq("identifier_value", normalizedValue)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find participant: ${error.message}`);
  }

  return data;
}

async function getParticipantRoomLevelIds(participantId: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("participant_level_assignments")
    .select("organization_levels(id)")
    .eq("participant_id", participantId);

  if (error) {
    throw new Error(`Failed to load participant room levels: ${error.message}`);
  }

  return ((data ?? []) as ParticipantRoomLevelAssignmentRow[])
    .map((assignment) =>
      Array.isArray(assignment.organization_levels)
        ? assignment.organization_levels[0]
        : assignment.organization_levels,
    )
    .filter((level): level is { id: string } => Boolean(level))
    .map((level) => level.id);
}

export async function getParticipantRoomContext(code: string) {
  const organization = await getOrganizationByCodeForRoom(code);
  const session = await getRoomSession(organization.id);

  if (!session || session.organizationId !== organization.id) {
    return null;
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_participants")
    .select("id,display_name,status")
    .eq("id", session.participantId)
    .eq("organization_id", organization.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load participant room access: ${error.message}`);
  }

  const participant = data as ParticipantRoomParticipantRow | null;

  if (!participant) {
    return null;
  }

  return {
    organization,
    participant: {
      id: participant.id,
      displayName: participant.display_name,
      levelIds: await getParticipantRoomLevelIds(participant.id),
    },
  } satisfies ParticipantRoomContext;
}

function filterParticipantRoomMessages(
  participantLevelIds: string[],
  messages: ParticipantRoomRevealedMessage[],
) {
  return filterRevealedMessages(messages).filter((message) =>
    canSeeRevealedMessages(participantLevelIds, message),
  );
}

export async function getParticipantRoomData(code: string) {
  const context = await getParticipantRoomContext(code);

  if (!context) {
    return null;
  }

  const [votes, messageChannels, revealedMessages] = await Promise.all([
    listParticipantRoomVotes(
      context.organization.id,
      context.participant.id,
    ),
    listParticipantRoomMessageChannels(context.organization.id),
    listParticipantRoomRevealedMessages(context.organization.id),
  ]);

  const visibleSections = getVisibleParticipantRoomSections({
    participantLevelIds: context.participant.levelIds,
    votes,
    messageChannels,
  });
  const visibleMessages = filterParticipantRoomMessages(
    context.participant.levelIds,
    revealedMessages,
  );

  return {
    organizationCode: context.organization.code,
    organizationName: context.organization.name,
    participantDisplayName: context.participant.displayName,
    votes: visibleSections.votes.map((vote) => ({
      ...vote,
      canSeeResults: canSeeVoteResults(context.participant.levelIds, vote),
    })),
    messageChannels: visibleSections.messageChannels,
    revealedMessages: visibleMessages,
    accessSummary: getParticipantRoomAccessSummary({
      participantLevelIds: context.participant.levelIds,
      votes: visibleSections.votes,
      messageChannels: visibleSections.messageChannels,
      revealedMessages: visibleMessages,
    }),
  } satisfies ParticipantRoomData;
}
