"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  createMessageChannel,
  toggleMessageReveal,
} from "@/lib/feedback/messages";
import type { MessageChannelStatus } from "@/lib/feedback/types";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildMessagesPath(code: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const path = `/admin/org/${code}/messages`;

  return query ? `${path}?${query}` : path;
}

function parseMessageChannelStatus(value: string): MessageChannelStatus {
  if (value === "draft" || value === "open" || value === "closed") {
    return value;
  }

  throw new Error("Channel status is invalid.");
}

export async function addMessageChannel(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);

  try {
    await createMessageChannel({
      organizationId: organization.id,
      title: String(formData.get("title") ?? ""),
      prompt: String(formData.get("prompt") ?? ""),
      submitLevelIds: formData.getAll("submitLevelIds").map(String),
      revealLevelIds: formData.getAll("revealLevelIds").map(String),
      status: parseMessageChannelStatus(String(formData.get("status") ?? "open")),
    });
  } catch (error) {
    redirect(
      buildMessagesPath(code, {
        error: getErrorMessage(error, "Unable to create message channel."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/messages`);
  redirect(buildMessagesPath(code, { status: "channel-created" }));
}

export async function setMessageReveal(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);

  try {
    await toggleMessageReveal({
      messageId: String(formData.get("messageId") ?? ""),
      organizationId: organization.id,
      revealed: String(formData.get("revealed") ?? "") === "true",
    });
  } catch (error) {
    redirect(
      buildMessagesPath(code, {
        error: getErrorMessage(error, "Unable to update message visibility."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/messages`);
  redirect(buildMessagesPath(code, { status: "message-updated" }));
}
