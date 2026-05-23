import Link from "next/link";

import {
  listMessageChannels,
  listMessageEntries,
} from "@/lib/feedback/messages";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  getOrganizationLevels,
  type OrganizationLevel,
} from "@/lib/feedback/participants";

import { addMessageChannel, setMessageReveal } from "./actions";

type MessagesPageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
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

function getLevelNames(levelIds: string[], levelsById: Map<string, OrganizationLevel>) {
  const names = levelIds
    .map((levelId) => levelsById.get(levelId)?.name)
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names : ["None selected"];
}

function renderLevelCheckboxes(
  levels: OrganizationLevel[],
  name: "submitLevelIds" | "revealLevelIds",
) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {levels.map((level) => (
        <label
          key={`${name}-${level.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
        >
          <input
            type="checkbox"
            name={name}
            value={level.id}
            className="h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-emerald-300"
          />
          <span>{level.name}</span>
        </label>
      ))}
    </div>
  );
}

export default async function AdminOrganizationMessagesPage({
  params,
  searchParams,
}: MessagesPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await requireOwnedOrganization(code);
  const [levels, channels, entries] = await Promise.all([
    getOrganizationLevels(organization.id),
    listMessageChannels(organization.id),
    listMessageEntries(organization.id),
  ]);
  const createChannelAction = addMessageChannel.bind(null, code);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const levelsById = new Map(levels.map((level) => [level.id, level]));
  const hasLevels = levels.length > 0;
  const revealedEntries = entries.filter((entry) => entry.revealed).length;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="grid gap-6">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">
            Anonymous review
          </p>
          <h2 className="mt-3 font-heading text-2xl text-white">Messages</h2>
          <p className="mt-3 text-sm text-white/65">
            Open structured channels for anonymous feedback and decide which
            responses are revealed back to participants.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Channels
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {channels.length}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Entries
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {entries.length}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Revealed
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {revealedEntries}
              </dd>
            </div>
          </dl>
        </article>

        <form
          action={createChannelAction}
          className="rounded-3xl border border-white/10 bg-[#0f141d] p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl text-white">
                Create message channel
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Define who can submit notes and which levels can see revealed
                entries for the channel.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              {hasLevels ? "Ready" : "Levels required"}
            </span>
          </div>

          {status === "channel-created" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Message channel created successfully.
            </p>
          ) : null}

          {status === "message-updated" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Message visibility updated successfully.
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

          {!hasLevels ? (
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm text-amber-100">
              Add at least one audience level before opening a channel.{" "}
              <Link
                href={`/admin/org/${code}/levels`}
                className="font-semibold underline underline-offset-4"
              >
                Manage levels
              </Link>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-white/80">
                Channel title
              </label>
              <input
                id="title"
                name="title"
                placeholder="Leadership feedback"
                required
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="prompt"
                className="text-sm font-medium text-white/80"
              >
                Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                placeholder="What should leadership hear this week?"
                required
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
              />
            </div>

            <div className="grid gap-2 sm:max-w-[240px]">
              <label
                htmlFor="status"
                className="text-sm font-medium text-white/80"
              >
                Initial status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="open"
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Submit levels
              </legend>
              <p className="text-sm text-white/50">
                Participants in these levels can submit anonymous messages.
              </p>
              {renderLevelCheckboxes(levels, "submitLevelIds")}
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Reveal levels
              </legend>
              <p className="text-sm text-white/50">
                Participants in these levels can see revealed entries.
              </p>
              {renderLevelCheckboxes(levels, "revealLevelIds")}
            </fieldset>
          </div>

          <button
            type="submit"
            disabled={!hasLevels}
            className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create channel
          </button>
        </form>
      </div>

      <div className="grid gap-6">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl text-white">
                Current channels
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Review who can submit and who can see revealed messages in each
                channel.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              Newest first
            </span>
          </div>

          {channels.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {channels.map((channel) => {
                const createdAt = formatDate(channel.created_at);

                return (
                  <article
                    key={channel.id}
                    className="rounded-2xl border border-white/10 bg-[#0b1018] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {channel.title}
                        </h4>
                        <p className="mt-2 text-sm text-white/60">
                          {channel.prompt}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
                          {channel.status}
                        </span>
                        {createdAt ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                            Added {createdAt}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm text-white/65">
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                          Submit audience
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {getLevelNames(channel.submit_level_ids, levelsById).map(
                            (name) => (
                              <span
                                key={`${channel.id}-submit-${name}`}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                              >
                                {name}
                              </span>
                            ),
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                          Reveal audience
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {getLevelNames(channel.reveal_level_ids, levelsById).map(
                            (name) => (
                              <span
                                key={`${channel.id}-reveal-${name}`}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                              >
                                {name}
                              </span>
                            ),
                          )}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-white/55">
              No channels have been created for this organization yet.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl text-white">Recent entries</h3>
              <p className="mt-2 text-sm text-white/60">
                Reveal individual messages when they are appropriate to share
                back with the audience.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              Moderation
            </span>
          </div>

          {entries.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {entries.map((entry) => {
                const toggleAction = setMessageReveal.bind(null, code);
                const createdAt = formatDate(entry.created_at);

                return (
                  <form
                    key={entry.id}
                    action={toggleAction}
                    className="rounded-2xl border border-white/10 bg-[#0b1018] p-4"
                  >
                    <input type="hidden" name="messageId" value={entry.id} />
                    <input
                      type="hidden"
                      name="revealed"
                      value={String(!entry.revealed)}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                          {entry.channel_title}
                        </p>
                        <p className="mt-3 text-sm text-white/80">
                          {entry.body}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={`rounded-full border px-3 py-1 ${
                            entry.revealed
                              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                              : "border-white/10 bg-white/5 text-white/55"
                          }`}
                        >
                          {entry.revealed ? "Revealed" : "Hidden"}
                        </span>
                        {createdAt ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                            {createdAt}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      {entry.revealed ? "Hide message" : "Reveal message"}
                    </button>
                  </form>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-white/55">
              No anonymous messages have been submitted yet.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
