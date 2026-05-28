import { notFound, redirect } from "next/navigation";

import Breadcrumbs from "@/components/breadcrumbs";
import ParticipantAccessForm from "@/components/participant-access-form";
import { getOrganizationByCodeForRoom } from "@/lib/feedback/organizations";
import { getParticipantRoomContext } from "@/lib/feedback/participants";

type ParticipantAccessPageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getAccessErrorMessage(
  error: string | undefined,
  message: string | undefined,
) {
  if (error === "identifier-required") {
    return "Enter the approved identifier for this room.";
  }

  if (error === "access-denied") {
    return "That email is not approved for this room.";
  }

  if (error === "code-required") {
    return "Enter the verification code from your email.";
  }

  if (error === "code-invalid") {
    return "That code is invalid or expired. Request a new one.";
  }

  if (error === "request-failed" || error === "verification-failed") {
    return message ?? "We could not complete verification. Try again.";
  }

  if (error === "rate-limited") {
    return message ?? "Too many codes were sent. Wait a minute and try again.";
  }

  return null;
}

function getAccessStatusMessage(status: string | undefined) {
  if (status === "signed-out") {
    return "You left the participant room. Verify again to re-enter.";
  }

  if (status === "code-sent") {
    return "We sent a verification code to your email address.";
  }

  return null;
}

export default async function ParticipantAccessPage({
  params,
  searchParams,
}: ParticipantAccessPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await getOrganizationByCodeForRoom(code).catch(
    () => null,
  );

  if (!organization) {
    notFound();
  }

  const context = await getParticipantRoomContext(code);
  const identifierValue = readSearchParam(resolvedSearchParams, "identifier");
  const verificationStep = readSearchParam(resolvedSearchParams, "step");
  const errorMessage = readSearchParam(resolvedSearchParams, "message");
  const emailVerificationEnabled =
    organization.participant_identifier_type === "email";

  if (context) {
    redirect(`/room/${code}/space`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(15,23,42,0.28)]">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Participant verification
            </p>
            <h1 className="mt-4 font-heading text-3xl md:text-4xl">
              {organization.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/65 md:text-base">
              {emailVerificationEnabled
                ? "This room is limited to approved participants. We will send a one-time code to your approved email address before you enter."
                : "This room is limited to approved participants. Verify with the identifier chosen by the organizer to enter the shared anonymous workspace."}
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#0f141d] p-5">
                <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                  Room code
                </dt>
                <dd className="mt-2 font-mono text-sm text-white/85">
                  {organization.code}
                </dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#0f141d] p-5">
                <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                  Verification method
                </dt>
                <dd className="mt-2 text-sm text-white/85">
                  {organization.participant_identifier_label}
                </dd>
              </div>
            </dl>

            <div className="mt-8 rounded-3xl border border-white/10 bg-[#0f141d] p-5">
              <h2 className="font-heading text-xl text-white">
                What happens after entry
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-white/65">
                <li>View only the votes and message channels assigned to your audience.</li>
                <li>Stay anonymous to other participants while the system keeps your access verified.</li>
                <li>See results or revealed messages only when the organizer has allowed them for your audience.</li>
              </ul>
            </div>

            {emailVerificationEnabled ? (
              <p className="mt-6 text-sm text-white/55">
                Keep the email inbox that matches your participant record open.
              </p>
            ) : null}
          </article>

          <ParticipantAccessForm
            code={code}
            organizationName={organization.name}
            identifierLabel={organization.participant_identifier_label}
            identifierType={organization.participant_identifier_type}
            identifierValue={identifierValue ?? ""}
            verificationStep={verificationStep === "code"}
            error={getAccessErrorMessage(
              readSearchParam(resolvedSearchParams, "error"),
              errorMessage,
            )}
            status={getAccessStatusMessage(
              readSearchParam(resolvedSearchParams, "status"),
            )}
          />
        </section>
      </main>
    </div>
  );
}
