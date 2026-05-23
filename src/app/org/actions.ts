"use server";

import { redirect } from "next/navigation";
import { createOrganization } from "./store";

export async function createOrgAction(formData: FormData) {
  const name = String(formData.get("name") || "");
  const org = await createOrganization(name);
  redirect(`/admin/org/${org.code}`);
}
