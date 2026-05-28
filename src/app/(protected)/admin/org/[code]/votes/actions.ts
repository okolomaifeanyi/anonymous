"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  createVote,
  deleteVote,
  deleteVoteImage,
  getVoteById,
  parseVoteInput,
  uploadVoteImage,
  updateVote,
} from "@/lib/feedback/votes";
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

function buildVoteEditPath(
  code: string,
  voteId: string,
  params: Record<string, string>,
) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const path = `/admin/org/${code}/votes/${voteId}`;

  return query ? `${path}?${query}` : path;
}

function parseVoteStatus(value: string): VoteStatus {
  if (value === "draft" || value === "active" || value === "closed") {
    return value;
  }

  throw new Error("Vote status is invalid.");
}

function getImageFile(formData: FormData) {
  const value = formData.get("imageFile");

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

export async function addVote(code: string, formData: FormData) {
  const organization = await requireOwnedOrganization(code);
  const voteId = crypto.randomUUID();
  const imageFile = getImageFile(formData);
  let uploadedImageUrl: string | null = null;

  try {
    const vote = parseVoteInput({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      tag: String(formData.get("tag") ?? ""),
      imageUrl: "",
      eligibleLevelIds: formData.getAll("eligibleLevelIds").map(String),
      liveResultLevelIds: formData.getAll("liveResultLevelIds").map(String),
      finalResultLevelIds: formData.getAll("finalResultLevelIds").map(String),
    });

    const uploadedImage = imageFile
      ? await uploadVoteImage({
          organizationId: organization.id,
          voteId,
          file: imageFile,
        })
      : null;

    uploadedImageUrl = uploadedImage?.imageUrl ?? null;

    await createVote({
      id: voteId,
      organizationId: organization.id,
      ...vote,
      imageUrl: uploadedImageUrl,
      status: parseVoteStatus(String(formData.get("status") ?? "active")),
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteVoteImage(uploadedImageUrl).catch(() => undefined);
    }

    redirect(
      buildVotesPath(code, {
        error: getErrorMessage(error, "Unable to create vote."),
      }),
    );
  }

  revalidatePath(`/admin/org/${code}/votes`);
  redirect(buildVotesPath(code, { status: "vote-created" }));
}

export async function editVote(
  code: string,
  voteId: string,
  formData: FormData,
) {
  const organization = await requireOwnedOrganization(code);
  const imageFile = getImageFile(formData);
  let existingVote: Awaited<ReturnType<typeof getVoteById>> | null = null;
  let nextImageUrl = null as string | null;
  let uploadedImageUrl: string | null = null;

  try {
    existingVote = await getVoteById(organization.id, voteId);
    nextImageUrl = existingVote.image_url;

    const vote = parseVoteInput({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      tag: String(formData.get("tag") ?? ""),
      imageUrl: "",
      eligibleLevelIds: formData.getAll("eligibleLevelIds").map(String),
      liveResultLevelIds: formData.getAll("liveResultLevelIds").map(String),
      finalResultLevelIds: formData.getAll("finalResultLevelIds").map(String),
    });

    if (imageFile) {
      const uploadedImage = await uploadVoteImage({
        organizationId: organization.id,
        voteId,
        file: imageFile,
      });

      uploadedImageUrl = uploadedImage.imageUrl;
      nextImageUrl = uploadedImage.imageUrl;
    }

    await updateVote(organization.id, voteId, {
      organizationId: organization.id,
      ...vote,
      imageUrl: nextImageUrl,
      status: parseVoteStatus(String(formData.get("status") ?? "active")),
    });
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteVoteImage(uploadedImageUrl).catch(() => undefined);
    }

    redirect(
      buildVoteEditPath(code, voteId, {
        error: getErrorMessage(error, "Unable to update vote."),
      }),
    );
  }

  if (
    imageFile &&
    existingVote?.image_url &&
    existingVote.image_url !== nextImageUrl
  ) {
    await deleteVoteImage(existingVote.image_url).catch(() => undefined);
  }

  revalidatePath(`/admin/org/${code}/votes`);
  revalidatePath(`/admin/org/${code}/votes/${voteId}`);
  redirect(buildVoteEditPath(code, voteId, { status: "vote-updated" }));
}

export async function removeVote(code: string, voteId: string) {
  const organization = await requireOwnedOrganization(code);
  let existingVote: Awaited<ReturnType<typeof getVoteById>> | null = null;

  try {
    existingVote = await getVoteById(organization.id, voteId);
    await deleteVote(organization.id, voteId);
  } catch (error) {
    redirect(
      buildVoteEditPath(code, voteId, {
        error: getErrorMessage(error, "Unable to delete vote."),
      }),
    );
  }

  await deleteVoteImage(existingVote?.image_url).catch(() => undefined);

  revalidatePath(`/admin/org/${code}/votes`);
  redirect(buildVotesPath(code, { status: "vote-deleted" }));
}
