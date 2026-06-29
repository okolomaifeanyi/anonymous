import {
  leaveParticipantRoom,
  revealParticipantMessage,
  submitParticipantMessage,
  submitParticipantVote,
} from "@/app/room/[code]/space/actions";
import type { ParticipantRoomData } from "@/lib/feedback/participants";
import BackgroundOrbs from "@/components/background-orbs";
import SubmitButton from "@/components/ui/submit-button";

type ParticipantRoomProps = {
  room: ParticipantRoomData;
  error: string | null;
  status: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export default function ParticipantRoom({
  room,
  error,
  status,
}: ParticipantRoomProps) {
  const voteAction = submitParticipantVote.bind(null, room.organizationCode);
  const messageAction = submitParticipantMessage.bind(null, room.organizationCode);
  const revealAction = revealParticipantMessage.bind(null, room.organizationCode);
  const leaveAction = leaveParticipantRoom.bind(null, room.organizationCode);
  const visibleResults = room.votes.filter((vote) => vote.canSeeResults);
  const hasVotes = room.votes.length > 0;
  const hasMessageChannels = room.messageChannels.length > 0;
  const hasPrivateMessages = room.privateMessages.length > 0;
  const hasVisibleResults = visibleResults.length > 0;
  const hasRevealedMessages = room.revealedMessages.length > 0;
  const accessSummaryItems = [
    {
      label: "Active votes",
      value: room.accessSummary.voteCount,
      description: "Open vote cards.",
    },
    {
      label: "Message channels",
      value: room.accessSummary.messageChannelCount,
      description: "Open message channels.",
    },
    {
      label: "Visible results",
      value: room.accessSummary.resultCount,
      description: "Results you can see.",
    },
    {
      label: "Revealed messages",
      value: room.accessSummary.revealedMessageCount,
      description: "Messages you can see.",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200/70">
              Room
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              {room.organizationName}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              You only see what your audience allows. Other participants do not
              see your identity.
            </p>
            {room.participantDisplayName ? (
              <p className="text-sm text-muted-foreground/80">
                Verified as {room.participantDisplayName}
              </p>
            ) : null}
          </div>

          <form action={leaveAction}>
            <SubmitButton
              label="Leave"
              pendingLabel="Leaving..."
              className="inline-flex items-center justify-center rounded-full border border-border bg-muted/50 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </header>

        {status ? (
          <p
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
            role="status"
          >
            {status}
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {accessSummaryItems.length > 0 ? (
          <section
            aria-label="What you can access"
            className="overflow-hidden rounded-3xl border border-border bg-[var(--app-surface)]"
          >
            <div className="grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
              {accessSummaryItems.map((item) => (
                <article key={item.label} className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section className="space-y-12">
            {hasVotes ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Votes
                  </p>
                  <h2 className="font-heading text-2xl">Votes</h2>
                  <p className="text-sm text-muted-foreground">
                    Vote while active. Closed votes stay visible.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.votes.map((vote) => (
                    <article
                      key={vote.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {vote.tag}
                        </span>
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {vote.status}
                        </span>
                        {vote.participantChoice ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-100">
                            Your vote: {vote.participantChoice}
                          </span>
                        ) : null}
                      </div>

                      {vote.imageUrl ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={vote.imageUrl}
                            alt={vote.title}
                            loading="lazy"
                            className="h-52 w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {vote.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {vote.description}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <form action={voteAction}>
                          <input type="hidden" name="voteId" value={vote.id} />
                          <input type="hidden" name="choice" value="support" />
                          <SubmitButton
                            label="Support"
                            pendingLabel="Supporting..."
                            disabled={vote.status !== "active"}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-100"
                          />
                        </form>
                        <form action={voteAction}>
                          <input type="hidden" name="voteId" value={vote.id} />
                          <input type="hidden" name="choice" value="oppose" />
                          <SubmitButton
                            label="Oppose"
                            pendingLabel="Opposing..."
                            disabled={vote.status !== "active"}
                            className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/15 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-100"
                          />
                        </form>
                      </div>

                      {vote.canSeeResults ? (
                        <div className="mt-5 space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{vote.supportCount} support</span>
                            <span>{vote.opposeCount} oppose</span>
                            <span>{vote.totalCount} total</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                              style={{
                                width: `${Math.round(
                                  (vote.supportCount / (vote.totalCount || 1)) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-5 text-sm text-muted-foreground/70">
                          Results are hidden until opened.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasMessageChannels ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Messages
                  </p>
                  <h2 className="font-heading text-2xl">Messages</h2>
                  <p className="text-sm text-muted-foreground">
                    Send feedback anonymously. Only revealed messages return here.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.messageChannels.map((channel) => (
                    <article
                      key={channel.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                          {channel.status}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {
                            room.revealedMessages.filter(
                              (message) => message.channelId === channel.id,
                            ).length
                          }{" "}
                          visible
                          {room.revealedMessages.filter(
                            (message) => message.channelId === channel.id,
                          ).length === 1
                            ? ""
                            : "s"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {channel.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {channel.prompt}
                      </p>

                      <form action={messageAction} className="mt-5 grid gap-3">
                        <input
                          type="hidden"
                          name="channelId"
                          value={channel.id}
                        />
                        <label
                          htmlFor={`message-${channel.id}`}
                          className="text-sm font-medium text-foreground/80"
                        >
                          Message
                        </label>
                        <textarea
                          id={`message-${channel.id}`}
                          name="body"
                          rows={5}
                          disabled={channel.status !== "open"}
                          className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <SubmitButton
                          label="Send"
                          pendingLabel="Sending..."
                          disabled={channel.status !== "open"}
                          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        />
                      </form>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasPrivateMessages ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Private messages
                  </p>
                  <h2 className="font-heading text-2xl">Reveal</h2>
                  <p className="text-sm text-muted-foreground">
                    These messages are for you. Reveal them when ready.
                  </p>
                </div>

                <div className="space-y-4">
                  {room.privateMessages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-3xl border border-cyan-400/20 bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-100">
                          Private to you
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {message.channelTitle}
                      </h3>
                      <p className="mt-2 text-sm text-foreground/80">{message.body}</p>
                      <form action={revealAction} className="mt-5">
                        <input type="hidden" name="messageId" value={message.id} />
                        <SubmitButton
                          label="Reveal"
                          pendingLabel="Revealing..."
                          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </form>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <aside className="space-y-12">
            {hasVisibleResults ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Results
                  </p>
                  <h2 className="font-heading text-2xl">Results</h2>
                </div>

                <div className="space-y-4">
                  {visibleResults.map((vote) => (
                    <article
                      key={vote.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-foreground">
                          {vote.title}
                        </h3>
                        <span className="text-xs text-muted-foreground/60">
                          {vote.totalCount} total
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Support</span>
                          <span>{vote.supportCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Oppose</span>
                          <span>{vote.opposeCount}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {hasRevealedMessages ? (
              <section className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Revealed
                  </p>
                  <h2 className="font-heading text-2xl">Revealed</h2>
                </div>

                <div className="space-y-4">
                  {room.revealedMessages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-3xl border border-border bg-[var(--app-surface)] p-5"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground/60">
                        <span>{message.channelTitle}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-4 text-sm text-foreground/80">
                        {message.body}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
