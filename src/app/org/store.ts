import { createClient } from "@/lib/server";

export type Organization = {
  id: string;
  name: string;
  code: string;
};

async function generateUniqueCode(base: string) {
  const code = base.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  const supabase = await createClient();
  let attempt = 1;
  while (true) {
    const testCode = code + (attempt > 1 ? `-${attempt}` : '');
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("code", testCode)
      .maybeSingle();
    if (!data) return testCode;
    attempt++;
  }
}

async function rollbackOrganizationSetup(
  organizationId: string,
  reason: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organizationId);

  if (error) {
    console.error(`Org rollback error after ${reason}:`, error);
  }
}

export async function createOrganization(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Organization name is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to create an organization.");
  }

  const code = await generateUniqueCode(trimmed);

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: trimmed,
      code,
      owner_id: user.id,
      participant_identifier_type: "email",
      participant_identifier_label: "Email address",
    })
    .select("id,name,code")
    .single();

  if (error) {
    console.error('Org insert error:', error);
    throw new Error(`Failed to create organization: ${error.message}`);
  }

  const { error: levelError } = await supabase
    .from("organization_levels")
    .insert([
      {
        organization_id: data.id,
        name: "Public",
        slug: "public",
        position: 0,
      },
      {
        organization_id: data.id,
        name: "Executive",
        slug: "executive",
        position: 1,
      },
    ]);

  if (levelError) {
    console.error('Level insert error:', levelError);
    await rollbackOrganizationSetup(data.id, "level creation failure");
    throw new Error(`Failed to create organization levels: ${levelError.message}`);
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: data.id, user_id: user.id, role: "owner" });

  if (memberError) {
    console.error('Member insert error:', memberError);
    await rollbackOrganizationSetup(data.id, "member creation failure");
    throw new Error(`Failed to create organization member: ${memberError.message}`);
  }

  return data as Organization;
}

export async function getOrganizationByCode(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,code")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) {
    throw new Error("Organization not found.");
  }

  return data as Organization;
}
