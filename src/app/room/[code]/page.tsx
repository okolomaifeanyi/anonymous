import { redirect } from "next/navigation";

export default async function ParticipantRoomRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  redirect(`/org/${code}`);
}
