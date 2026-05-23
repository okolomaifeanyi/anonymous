import type { IdentifierType } from "@/lib/feedback/types";

type CreateLevelInput = {
  organizationId: string;
  name: string;
  position: number;
};

export function normalizeIdentifierValue(
  type: IdentifierType,
  value: string,
) {
  const trimmed = value.trim();

  if (type === "email") {
    return trimmed.toLowerCase();
  }

  if (type === "phone") {
    return trimmed.replace(/(?!^\+)[^\d]/g, "").replace(/^\++/, "+");
  }

  return trimmed;
}

export function slugifyLevelName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createLevel({
  organizationId,
  name,
  position,
}: CreateLevelInput) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const slug = slugifyLevelName(name);
  const { data, error } = await supabase
    .from("organization_levels")
    .insert({
      organization_id: organizationId,
      name,
      slug,
      position,
    })
    .select("id,organization_id,name,slug,position,created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create organization level: ${error.message}`);
  }

  return data;
}
