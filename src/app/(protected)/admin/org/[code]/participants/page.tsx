import Link from "next/link";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  getOrganizationLevels,
  listParticipants,
} from "@/lib/feedback/participants";
import SubmitButton from "@/components/ui/submit-button";

import { addParticipant, removeParticipant } from "./actions";

type ParticipantsPageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  if (!value) {
    return null;
  }

  return dateFormatter.format(new Date(value));
}

function getIdentifierInputType(identifierType: string) {
  if (identifierType === "email") {
    return "email";
  }

  if (identifierType === "phone") {
    return "tel";
  }

  return "text";
}

export default async function AdminOrganizationParticipantsPage({
  params,
  searchParams,
}: ParticipantsPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await requireOwnedOrganization(code);
  const [participants, levels] = await Promise.all([
    listParticipants(organization.id),
    getOrganizationLevels(organization.id),
  ]);
  const action = addParticipant.bind(null, code);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const identifierInputType = getIdentifierInputType(
    organization.participant_identifier_type,
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid gap-6">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
            Participant access
          </p>
          <h2 className="mt-3 font-heading text-2xl text-white">
            Approved participants
          </h2>
          <p className="mt-3 text-sm text-white/65">
            Only approved people can enter. They sign in with the configured{" "}
            {organization.participant_identifier_label.toLowerCase()}.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Identifier rule
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {organization.participant_identifier_label}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Active roster
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {participants.length} participant
                {participants.length === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </article>

        <form
          action={action}
          className="rounded-3xl border border-white/10 bg-[#0f141d] p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl text-white">
                Add participant
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Add one person. Set levels.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              {levels.length} level{levels.length === 1 ? "" : "s"} available
            </span>
          </div>

          {status === "participant-added" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Participant added successfully.
            </p>
          ) : status === "participant-deleted" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Participant deleted.
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label
                htmlFor="displayName"
                className="text-sm font-medium text-white/80"
              >
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="identifierValue"
                className="text-sm font-medium text-white/80"
              >
                {organization.participant_identifier_label}
              </label>
              <input
                id="identifierValue"
                name="identifierValue"
                type={identifierInputType}
                inputMode={identifierInputType === "tel" ? "tel" : undefined}
                autoComplete={
                  identifierInputType === "email"
                    ? "email"
                    : identifierInputType === "tel"
                      ? "tel"
                      : "off"
                }
                required
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              />
            </div>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium text-white/80">
                Initial level access
              </legend>
              {levels.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {levels.map((level) => (
                    <label
                      key={level.id}
                      htmlFor={`level-${level.id}`}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white/80"
                    >
                      <input
                        id={`level-${level.id}`}
                        name="levelIds"
                        type="checkbox"
                        value={level.id}
                        className="mt-0.5 h-4 w-4 rounded border-white/15 bg-transparent text-white"
                      />
                      <span>
                        <span className="block font-medium text-white">
                          {level.name}
                        </span>
                        <span className="mt-1 block text-xs text-white/45">
                          Audience group #{level.position + 1}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                  No levels are available yet. You can still add participants
                  now and group them later from the{" "}
                  <Link
                    href={`/admin/org/${code}/levels`}
                    className="text-white underline decoration-white/35 underline-offset-4 transition hover:text-cyan-100"
                  >
                    levels page
                  </Link>
                  .
                </p>
              )}
            </fieldset>
          </div>

          <SubmitButton
            label="Add participant"
            pendingLabel="Adding..."
            className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      </div>

      <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl text-white">Current roster</h3>
            <p className="mt-2 text-sm text-white/60">
              Who can enter and what they can access.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
            {participants.length} total
          </span>
        </div>

        {participants.length > 0 ? (
          <div className="mt-6 grid gap-3">
            {participants.map((participant) => {
              const createdAt = formatDate(participant.created_at);
              const displayTitle =
                participant.display_name || participant.identifier_value;

              return (
                <article
                  key={participant.id}
                  className="rounded-2xl border border-white/10 bg-[#0b1018] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {displayTitle}
                      </h4>
                      <p className="mt-1 text-sm text-white/60">
                        {participant.identifier_value}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                        {participant.status}
                      </span>
                      {createdAt ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                          Added {createdAt}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {participant.levels.length > 0 ? (
                      participant.levels.map((level) => (
                        <span
                          key={level.id}
                          className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                        >
                          {level.name}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                        No level assigned
                      </span>
                    )}
                  </div>

                  <form
                    action={removeParticipant.bind(null, code)}
                    className="mt-4 flex justify-end"
                  >
                    <input
                      type="hidden"
                      name="participantId"
                      value={participant.id}
                    />
                    <SubmitButton
                      label="Delete"
                      pendingLabel="Deleting..."
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-white/55">
            No participants yet.
          </div>
        )}
      </article>
    </section>
  );
}
