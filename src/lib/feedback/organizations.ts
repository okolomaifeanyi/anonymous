import type { IdentifierType } from "@/lib/feedback/types";

import { normalizeOrganizationCode } from "@/lib/feedback/organization-code";
import { createClient } from "@/lib/server";
import { notFound } from "next/navigation";

type OwnedOrganization = {
  id: string;
  name: string;
  code: string;
  owner_id: string | null;
  participant_identifier_type: IdentifierType;
  participant_identifier_label: string;
};

type RoomOrganization = {
  id: string;
  name: string;
  code: string;
  participant_identifier_type: IdentifierType;
  participant_identifier_label: string;
};

type OwnedOrganizationSummary = {
  id: string;
  name: string;
  code: string;
  created_at: string;
  participant_identifier_label: string;
};

export async function requireOwnedOrganization(code: string) {
  const normalizedCode = normalizeOrganizationCode(code);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select(
      "id,name,code,owner_id,participant_identifier_type,participant_identifier_label",
    )
    .eq("code", normalizedCode)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return data as OwnedOrganization;
}

export async function getOrganizationByCodeForRoom(code: string) {
  const normalizedCode = normalizeOrganizationCode(code);
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select(
      "id,name,code,participant_identifier_type,participant_identifier_label",
    )
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    throw new Error("Organization not found.");
  }

  return data as RoomOrganization;
}

export async function listOwnedOrganizations() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,code,created_at,participant_identifier_label")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load organizations: ${error.message}`);
  }

  return (data ?? []) as OwnedOrganizationSummary[];
}
