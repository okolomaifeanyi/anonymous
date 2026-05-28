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

type OrganizationQueryResult = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

type OrganizationQuery = {
  eq(column: string, value: string): OrganizationQuery;
  maybeSingle(): Promise<OrganizationQueryResult>;
};

type OrganizationClient = {
  from(table: string): {
    select(columns: string): OrganizationQuery;
  };
};

function getOrganizationCodeCandidates(code: string) {
  const trimmedCode = code.trim();
  const normalizedCode = normalizeOrganizationCode(trimmedCode);
  const lowerCasedCode = trimmedCode.toLowerCase();

  return [trimmedCode, normalizedCode, lowerCasedCode].filter(
    (candidate, index, candidates) => candidates.indexOf(candidate) === index,
  );
}

async function findOrganizationByCode(
  admin: OrganizationClient,
  code: string,
  selectColumns: string,
  ownerId?: string,
) {
  for (const candidate of getOrganizationCodeCandidates(code)) {
    let query = admin
      .from("organizations")
      .select(selectColumns)
      .eq("code", candidate);

    if (ownerId) {
      query = query.eq("owner_id", ownerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to load organization: ${error.message}`);
    }

    if (data) {
      return data;
    }
  }

  return null;
}

export async function requireOwnedOrganization(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient() as unknown as OrganizationClient;
  const data = await findOrganizationByCode(
    admin,
    code,
    "id,name,code,owner_id,participant_identifier_type,participant_identifier_label",
    user.id,
  );

  if (!data) {
    notFound();
  }

  return data as OwnedOrganization;
}

export async function getOrganizationByCodeForRoom(code: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient() as unknown as OrganizationClient;
  const data = await findOrganizationByCode(
    admin,
    code,
    "id,name,code,participant_identifier_type,participant_identifier_label",
  );

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
