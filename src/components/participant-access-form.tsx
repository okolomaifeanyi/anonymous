import { verifyParticipant } from "@/app/room/[code]/actions";
import type { IdentifierType } from "@/lib/feedback/types";
import SubmitButton from "@/components/ui/submit-button";
import CooldownSubmitButton from "@/components/ui/cooldown-submit-button";
import type { ReactNode } from "react";

type ParticipantAccessFormProps = {
  code: string;
  organizationName: string;
  identifierLabel: string;
  identifierType: IdentifierType;
  identifierValue: string;
  verificationStep: boolean;
  error: string | null;
  cooldownSeconds?: number;
  rateLimitBanner?: ReactNode;
  rateLimitBannerId?: string;
  status: string | null;
};

function getIdentifierInputType(identifierType: IdentifierType) {
  if (identifierType === "email") return "email";
  if (identifierType === "phone") return "tel";
  return "text";
}

function getIdentifierAutoComplete(identifierType: IdentifierType) {
  if (identifierType === "email") return "email";
  if (identifierType === "phone") return "tel";
  return "off";
}

function maskEmail(value: string) {
  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) return value;

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? ""}*`
      : `${localPart.slice(0, 2)}***`;
  const [domainName, ...rest] = domainPart.split(".");
  const maskedDomain =
    domainName.length <= 2
      ? `${domainName[0] ?? ""}*`
      : `${domainName.slice(0, 2)}***`;

  return `${maskedLocal}@${maskedDomain}${rest.length > 0 ? `.${rest.join(".")}` : ""}`;
}

export default function ParticipantAccessForm({
  code,
  organizationName,
  identifierLabel,
  identifierType,
  identifierValue,
  verificationStep,
  error,
  cooldownSeconds = 0,
  rateLimitBanner,
  rateLimitBannerId,
  status,
}: ParticipantAccessFormProps) {
  const action = verifyParticipant.bind(null, code);
  const inputType = getIdentifierInputType(identifierType);
  const describedBy = [
    status ? "participant-access-status" : null,
    error ? "participant-access-error" : null,
    rateLimitBanner ? rateLimitBannerId ?? "participant-access-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const isEmailFlow = identifierType === "email";
  const emailValue = identifierValue.trim();

  return (
    <article className="rounded-[2rem] border border-border bg-(--app-surface)/95 p-8 shadow-[0_0_50px_rgba(8,15,26,0.12)] dark:shadow-[0_0_50px_rgba(8,15,26,0.45)]">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
          {isEmailFlow ? "Email" : "Access"}
        </p>
        <h2 className="font-heading text-2xl md:text-3xl">
          Enter {organizationName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEmailFlow
            ? verificationStep
              ? `Code requested for ${emailValue ? maskEmail(emailValue) : "your email"}. Check inbox and spam.`
              : "Enter your email to get a code."
            : "Enter the approved identifier."}
        </p>
      </div>

      {status ? (
        <p
          id="participant-access-status"
          className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
          role="status"
        >
          {status}
        </p>
      ) : null}

      {error ? (
        <p
          id="participant-access-error"
          className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : rateLimitBanner ? (
        rateLimitBanner
      ) : null}

      {isEmailFlow ? (
        verificationStep ? (
          <div className="mt-6 grid gap-5">
            <form action={action} className="grid gap-5">
              <input type="hidden" name="intent" value="verify" />
              <input type="hidden" name="identifierValue" value={emailValue} />
              <div className="grid gap-2">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-foreground/80"
                >
                  Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  required
                  maxLength={8}
                  className="rounded-2xl border border-border bg-(--app-card) px-4 py-3 font-mono text-sm text-foreground outline-none transition focus:border-border/60"
                />
              </div>

              <SubmitButton
                label="Verify"
                pendingLabel="Verifying..."
                className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <form action={action} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="intent" value="request" />
              <input type="hidden" name="identifierValue" value={emailValue} />
              <CooldownSubmitButton
                label="Resend"
                pendingLabel="Sending..."
                initialCooldown={cooldownSeconds}
                className="inline-flex items-center justify-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
              />
              <a
                href={`/room/${code}`}
                className="text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Change email
              </a>
            </form>
          </div>
        ) : (
          <form action={action} className="mt-6 grid gap-5">
            <input type="hidden" name="intent" value="request" />
            <div className="grid gap-2">
              <label
                htmlFor="identifierValue"
                className="text-sm font-medium text-foreground/80"
              >
                {identifierLabel}
              </label>
              <input
                id="identifierValue"
                name="identifierValue"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                required
                className="rounded-2xl border border-border bg-(--app-card) px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60"
              />
            </div>

            <SubmitButton
              label="Send code"
              pendingLabel="Sending..."
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        )
      ) : (
        <form action={action} className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <label
              htmlFor="identifierValue"
              className="text-sm font-medium text-foreground/80"
            >
              {identifierLabel}
            </label>
            <input
              id="identifierValue"
              name="identifierValue"
              type={inputType}
              inputMode={inputType === "tel" ? "tel" : undefined}
              autoComplete={getIdentifierAutoComplete(identifierType)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              required
              className="rounded-2xl border border-border bg-(--app-card) px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60"
            />
          </div>

          <SubmitButton
            label="Enter room"
            pendingLabel="Entering..."
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      )}
    </article>
  );
}
