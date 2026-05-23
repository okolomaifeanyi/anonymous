type MessageEntry = {
  revealed: boolean;
};

export function filterRevealedMessages<T extends MessageEntry>(messages: T[]) {
  return messages.filter((message) => message.revealed);
}

export async function revealMessageEntry(id: string, revealed: boolean) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("message_entries")
    .update({ revealed })
    .eq("id", id)
    .select("id,channel_id,participant_id,body,revealed,created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update message entry reveal state: ${error.message}`);
  }

  return data;
}

export default filterRevealedMessages;
