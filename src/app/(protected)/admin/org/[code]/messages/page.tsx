import {
  listMessageChannelRevealParticipants,
  listMessageChannels,
  listMessageEntries,
  getMessageChannelFeatureSupport,
} from "@/lib/feedback/messages";
import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  getOrganizationLevels,
  listParticipants,
  type OrganizationLevel,
} from "@/lib/feedback/participants";
import MessageChannelForm from "@/components/message-channel-form";
import MessageChannelDeleteForm from "@/components/message-channel-delete-form";

import { addMessageChannel, deleteMessageChannelAction, setMessageReveal } from "./actions";

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

function getParticipantLabel(
  participant: { display_name: string | null; identifier_value: string },
) {
  return participant.display_name ?? participant.identifier_value;
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
  const [levels, channels, entries, participants, revealParticipants, featureSupport] = await Promise.all([
    getOrganizationLevels(organization.id),
    listMessageChannels(organization.id),
    listMessageEntries(organization.id),
    listParticipants(organization.id),
    listMessageChannelRevealParticipants(organization.id),
    getMessageChannelFeatureSupport(),
  ]);
  const createChannelAction = addMessageChannel.bind(null, code);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const levelsById = new Map(levels.map((level) => [level.id, level]));
  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const revealParticipantsByChannel = new Map<string, string[]>();
  for (const row of revealParticipants) {
    const ids = revealParticipantsByChannel.get(row.channel_id) ?? [];
    ids.push(row.participant_id);
    revealParticipantsByChannel.set(row.channel_id, ids);
  }
  const hasLevels = levels.length > 0;
  const revealedEntries = entries.filter((entry) => entry.revealed).length;
  const messageChannelParticipants = participants.map((participant) => ({
    id: participant.id,
    label: getParticipantLabel(participant),
    description: participant.identifier_value,
  })).filter((participant) => participantsById.get(participant.id)?.status === "active");

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

        {status === "channel-created" ? (
          <p
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            role="status"
          >
            Message channel created successfully.
          </p>
        ) : null}

        {status === "channel-deleted" ? (
          <p
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            role="status"
          >
            Message channel deleted successfully.
          </p>
        ) : null}

        {status === "message-updated" ? (
          <p
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            role="status"
          >
            Message visibility updated successfully.
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <MessageChannelForm
          action={createChannelAction}
          levels={levels}
          participants={messageChannelParticipants}
          hasLevels={hasLevels}
          participantRevealSupported={featureSupport.revealParticipants}
        />
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
                          {channel.reveal_audience_type === "participants"
                            ? (revealParticipantsByChannel.get(channel.id) ?? []).length > 0
                              ? (revealParticipantsByChannel.get(channel.id) ?? []).map(
                                  (participantId) => {
                                    const participant = participantsById.get(participantId);
                                    const label =
                                      participant?.display_name ??
                                      participant?.identifier_value ??
                                      "Unknown participant";

                                    return (
                                      <span
                                        key={`${channel.id}-reveal-participant-${participantId}`}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                                      >
                                        {label}
                                      </span>
                                    );
                                  },
                                )
                              : [
                                  <span
                                    key={`${channel.id}-reveal-participant-none`}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                                  >
                                    None selected
                                  </span>,
                                ]
                            : getLevelNames(channel.reveal_level_ids, levelsById).map(
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

                    <div className="mt-5 flex justify-end">
                      <MessageChannelDeleteForm
                        action={deleteMessageChannelAction.bind(null, code)}
                        channelId={channel.id}
                        channelTitle={channel.title}
                      />
                    </div>
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
