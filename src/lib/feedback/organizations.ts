import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/server";

type OwnedOrganization = {
  id: string;
  name: string;
  code: string;
  owner_id: string | null;
  participant_identifier_type: string;
  participant_identifier_label: string;
};

type RoomOrganization = {
  id: string;
  name: string;
  code: string;
  participant_identifier_type: string;
  participant_identifier_label: string;
};

export async function requireOwnedOrganization(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select(
      "id,name,code,owner_id,participant_identifier_type,participant_identifier_label",
    )
    .eq("code", code)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    throw new Error("Organization not found.");
  }

  return data as OwnedOrganization;
}

export async function getOrganizationByCodeForRoom(code: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select(
      "id,name,code,participant_identifier_type,participant_identifier_label",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    throw new Error("Organization not found.");
  }

  return data as RoomOrganization;
}
