type MessageEntry = {
  revealed: boolean;
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

export function filterRevealedMessages<T extends MessageEntry>(messages: T[]) {
  return messages.filter((message) => message.revealed);
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

export default filterRevealedMessages;
