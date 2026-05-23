"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { createVote, parseVoteInput } from "@/lib/feedback/votes";
import type { VoteStatus } from "@/lib/feedback/types";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildVotesPath(code: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const path = `/admin/org/${code}/votes`;

  return query ? `${path}?${query}` : path;
}

function parseVoteStatus(value: string): VoteStatus {
  if (value === "draft" || value === "active" || value === "closed") {
    return value;
  }

  throw new Error("Vote status is invalid.");
}

export async function addVote(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);

  try {
    const vote = parseVoteInput({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      tag: String(formData.get("tag") ?? ""),
      eligibleLevelIds: formData.getAll("eligibleLevelIds").map(String),
      liveResultLevelIds: formData.getAll("liveResultLevelIds").map(String),
      finalResultLevelIds: formData.getAll("finalResultLevelIds").map(String),
    });

    await createVote({
      organizationId: organization.id,
      ...vote,
      status: parseVoteStatus(String(formData.get("status") ?? "active")),
    });
  } catch (error) {
    redirect(
      buildVotesPath(code, {
        error: getErrorMessage(error, "Unable to create vote."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/votes`);
  redirect(buildVotesPath(code, { status: "vote-created" }));
}
