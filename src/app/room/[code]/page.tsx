import { notFound, redirect } from "next/navigation";

import BackgroundOrbs from "@/components/background-orbs";
import Breadcrumbs from "@/components/breadcrumbs";
import ParticipantAccessForm from "@/components/participant-access-form";
import RateLimitBanner from "@/components/rate-limit-banner";
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
  cooldown: string | undefined,
) {
  if (error === "identifier-required") return "Enter the approved identifier.";
  if (error === "access-denied") return "That email is not approved.";
  if (error === "code-required") return "Enter the code from your email.";
  if (error === "code-invalid") return "That code is invalid or expired. Request a new one.";

  if (error === "request-failed" || error === "verification-failed") {
    return message ?? "We could not complete verification. Try again.";
  }

  if (error === "rate-limited") {
    const parsedCooldown = Number.parseInt(cooldown ?? "", 10);
    if (Number.isFinite(parsedCooldown) && parsedCooldown > 0) {
      return message ?? `Email provider rate limit exceeded. Wait ${parsedCooldown} seconds and try again.`;
    }
    return message ?? "Email provider rate limit exceeded. Wait a minute and try again.";
  }

  return null;
}

function getAccessStatusMessage(status: string | undefined) {
  if (status === "signed-out") return "You left the room. Verify again to re-enter.";
  if (status === "code-sent") return "Code requested. Check your inbox and spam.";
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
  const organization = await getOrganizationByCodeForRoom(code).catch(() => null);

  if (!organization) notFound();

  const context = await getParticipantRoomContext(code);
  const identifierValue = readSearchParam(resolvedSearchParams, "identifier");
  const verificationStep = readSearchParam(resolvedSearchParams, "step");
  const errorMessage = readSearchParam(resolvedSearchParams, "message");
  const cooldown = readSearchParam(resolvedSearchParams, "cooldown");
  const parsedCooldown = Number.parseInt(cooldown ?? "", 10);
  const hasCooldown =
    Number.isFinite(parsedCooldown) && parsedCooldown > 0 ? parsedCooldown : 0;
  const emailVerificationEnabled =
    organization.participant_identifier_type === "email";

  if (context) redirect(`/room/${code}/space`);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-24 pt-10">
        <Breadcrumbs />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200/70">
              Verify access
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              {organization.name}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              {emailVerificationEnabled
                ? "Approved participants only. We send a code to your email before entry."
                : "Approved participants only. Enter the identifier set by the organizer."}
            </p>

            <div className="rounded-3xl border border-border bg-(--app-surface) p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    Room code
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-foreground/85">
                    {organization.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    Method
                  </dt>
                  <dd className="mt-2 text-sm text-foreground/85">
                    {organization.participant_identifier_label}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-border pt-5">
                <h2 className="font-heading text-lg text-foreground">After entry</h2>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <li>See the votes and messages assigned to you.</li>
                  <li>Stay anonymous to other participants.</li>
                  <li>See results and reveals only if allowed.</li>
                </ul>
              </div>

              {emailVerificationEnabled ? (
                <p className="mt-5 text-sm text-muted-foreground/80">
                  Keep your email inbox open.
                </p>
              ) : null}
            </div>
          </section>

          <ParticipantAccessForm
            code={code}
            organizationName={organization.name}
            identifierLabel={organization.participant_identifier_label}
            identifierType={organization.participant_identifier_type}
            identifierValue={identifierValue ?? ""}
            verificationStep={verificationStep === "code"}
            cooldownSeconds={hasCooldown}
            error={
              readSearchParam(resolvedSearchParams, "error") === "rate-limited"
                ? null
                : getAccessErrorMessage(
                    readSearchParam(resolvedSearchParams, "error"),
                    errorMessage,
                    cooldown,
                  )
            }
            rateLimitBanner={
              readSearchParam(resolvedSearchParams, "error") === "rate-limited" ? (
                <RateLimitBanner
                  id="participant-access-error"
                  className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
                  prefix="Email provider rate limit exceeded. Wait "
                  suffix=" seconds and try again."
                  initialSeconds={hasCooldown}
                />
              ) : null
            }
            status={getAccessStatusMessage(
              readSearchParam(resolvedSearchParams, "status"),
            )}
          />
        </section>
      </main>
    </div>
  );
}
