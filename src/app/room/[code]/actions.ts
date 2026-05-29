"use server";

import { redirect } from "next/navigation";

import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import {
  findEligibleParticipantByIdentifier,
  normalizeIdentifierValue,
} from "@/lib/feedback/participants";
import { setRoomSession } from "@/lib/feedback/room-session";
import { createClient } from "@/lib/server";

const ROOM_CODE_COOLDOWN_SECONDS = 60;

function formatSupabaseErrorMessage(
  error: { code?: string; message?: unknown; status?: number } | null | undefined,
  fallback: string,
) {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  if (error?.code && typeof error.status === "number") {
    return `${fallback} (${error.status}, code: ${error.code})`;
  }

  if (error?.code) {
    return `${fallback} (code: ${error.code})`;
  }

  if (typeof error?.status === "number") {
    return `${fallback} (${error.status})`;
  }

  return fallback;
}

function buildRoomAccessPath(
  code: string,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  const path = `/room/${code}`;

  return query ? `${path}?${query}` : path;
}

export async function verifyParticipant(code: string, formData: FormData) {
  const organization = await getOrganizationByCodeForRoom(code);
  const identifierType = organization.participant_identifier_type;
  const identifierValue = normalizeIdentifierValue(
    identifierType,
    String(formData.get("identifierValue") ?? ""),
  );
  const intent = String(formData.get("intent") ?? "").trim();

  if (!identifierValue) {
    redirect(
      buildRoomAccessPath(code, {
        error: "identifier-required",
      }),
    );
  }

  if (identifierType === "email") {
    const participant = await findEligibleParticipantByIdentifier({
      organizationId: organization.id,
      identifierType,
      identifierValue,
    }).catch(() => null);

    if (!participant) {
      redirect(
        buildRoomAccessPath(code, {
          error: "access-denied",
        }),
      );
    }

    if (intent === "request") {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: identifierValue,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        redirect(
          buildRoomAccessPath(code, {
            error:
              error.code === "over_email_send_rate_limit"
                ? "rate-limited"
                : "request-failed",
            message:
              error.code === "over_email_send_rate_limit"
                ? `Email provider rate limit exceeded. Wait ${ROOM_CODE_COOLDOWN_SECONDS} seconds and try again.`
                : formatSupabaseErrorMessage(
                    error,
                    "Could not send a verification code.",
                  ),
            ...(error.code === "over_email_send_rate_limit"
              ? { cooldown: String(ROOM_CODE_COOLDOWN_SECONDS) }
              : {}),
            step: "code",
            identifier: identifierValue,
          }),
        );
      }

      redirect(
        buildRoomAccessPath(code, {
          status: "code-sent",
          cooldown: String(ROOM_CODE_COOLDOWN_SECONDS),
          step: "code",
          identifier: identifierValue,
        }),
      );
    }

    const token = String(formData.get("code") ?? "").trim();

    if (!token) {
      redirect(
        buildRoomAccessPath(code, {
          error: "code-required",
          step: "code",
          identifier: identifierValue,
        }),
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: identifierValue,
      token,
      type: "email",
    });

    if (error) {
      redirect(
        buildRoomAccessPath(code, {
          error:
            error.code === "otp_expired" || error.code === "otp_invalid"
              ? "code-invalid"
              : "verification-failed",
          message:
            error.code === "otp_expired" || error.code === "otp_invalid"
              ? "That code is invalid or expired. Request a new one."
              : formatSupabaseErrorMessage(
                  error,
                  "Could not verify the code.",
                ),
          step: "code",
          identifier: identifierValue,
        }),
      );
    }

    await setRoomSession({
      organizationId: organization.id,
      participantId: participant.id,
    });

    redirect(`/room/${code}/space`);
  }

  const participant = await findEligibleParticipantByIdentifier({
    organizationId: organization.id,
    identifierType,
    identifierValue,
  }).catch(() => null);

  if (!participant) {
    redirect(
      buildRoomAccessPath(code, {
        error: "access-denied",
      }),
    );
  }

  await setRoomSession({
    organizationId: organization.id,
    participantId: participant.id,
  });

  redirect(`/room/${code}/space`);
}
