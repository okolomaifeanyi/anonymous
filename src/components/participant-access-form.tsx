import { verifyParticipant } from "@/app/room/[code]/actions";
import type { IdentifierType } from "@/lib/feedback/types";

type ParticipantAccessFormProps = {
  code: string;
  organizationName: string;
  identifierLabel: string;
  identifierType: IdentifierType;
  error: string | null;
  status: string | null;
};

function getIdentifierInputType(identifierType: IdentifierType) {
  if (identifierType === "email") {
    return "email";
  }

  if (identifierType === "phone") {
    return "tel";
  }

  return "text";
}

function getIdentifierAutoComplete(identifierType: IdentifierType) {
  if (identifierType === "email") {
    return "email";
  }

  if (identifierType === "phone") {
    return "tel";
  }

  return "off";
}

function getIdentifierPlaceholder(identifierType: IdentifierType) {
  if (identifierType === "email") {
    return "person@company.com";
  }

  if (identifierType === "phone") {
    return "+234 801 234 5678";
  }

  return "Enter your approved identifier";
}

export default function ParticipantAccessForm({
  code,
  organizationName,
  identifierLabel,
  identifierType,
  error,
  status,
}: ParticipantAccessFormProps) {
  const action = verifyParticipant.bind(null, code);
  const inputType = getIdentifierInputType(identifierType);
  const describedBy = [
    status ? "participant-access-status" : null,
    error ? "participant-access-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#101722]/95 p-8 shadow-[0_0_50px_rgba(8,15,26,0.45)]">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-white/55">
          Access form
        </p>
        <h2 className="font-heading text-2xl text-white md:text-3xl">
          Enter {organizationName}
        </h2>
        <p className="text-sm text-white/65">
          Use the exact identifier approved by the organizer. If it matches an
          active participant record, you will enter the unified room.
        </p>
      </div>

      {status ? (
        <p
          id="participant-access-status"
          className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          {status}
        </p>
      ) : null}

      {error ? (
        <p
          id="participant-access-error"
          className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form action={action} className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <label
            htmlFor="identifierValue"
            className="text-sm font-medium text-white/80"
          >
            {identifierLabel}
          </label>
          <input
            id="identifierValue"
            name="identifierValue"
            type={inputType}
            inputMode={inputType === "tel" ? "tel" : undefined}
            autoComplete={getIdentifierAutoComplete(identifierType)}
            placeholder={getIdentifierPlaceholder(identifierType)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            required
            className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-cyan-100"
        >
          Verify and enter room
        </button>
      </form>
    </article>
  );
}
