import Link from "next/link";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  getOrganizationLevels,
  type OrganizationLevel,
} from "@/lib/feedback/participants";
import { listVotes } from "@/lib/feedback/votes";

import { addVote } from "./actions";

type VotesPageProps = {
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

function getLevelNames(levelIds: string[], levelsById: Map<string, OrganizationLevel>) {
  const names = levelIds
    .map((levelId) => levelsById.get(levelId)?.name)
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names : ["None selected"];
}

function renderLevelCheckboxes(
  levels: OrganizationLevel[],
  name: "eligibleLevelIds" | "liveResultLevelIds" | "finalResultLevelIds",
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
            className="h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-cyan-300"
          />
          <span>{level.name}</span>
        </label>
      ))}
    </div>
  );
}

export default async function AdminOrganizationVotesPage({
  params,
  searchParams,
}: VotesPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await requireOwnedOrganization(code);
  const [levels, votes] = await Promise.all([
    getOrganizationLevels(organization.id),
    listVotes(organization.id),
  ]);
  const action = addVote.bind(null, code);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const levelsById = new Map(levels.map((level) => [level.id, level]));
  const hasLevels = levels.length > 0;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="grid gap-6">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
            Ballot setup
          </p>
          <h2 className="mt-3 font-heading text-2xl text-white">Votes</h2>
          <p className="mt-3 text-sm text-white/65">
            Publish level-scoped votes, decide who can participate, and control
            who sees live versus final results.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Active vote list
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {votes.length} vote{votes.length === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Audience levels
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {levels.length} level{levels.length === 1 ? "" : "s"}
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
              <h3 className="font-heading text-xl text-white">Create vote</h3>
              <p className="mt-2 text-sm text-white/60">
                Choose the audience first, then decide where live and final
                results should be visible.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              {hasLevels ? "Ready" : "Levels required"}
            </span>
          </div>

          {status === "vote-created" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Vote created successfully.
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
              Add at least one audience level before creating votes.{" "}
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
                Vote title
              </label>
              <input
                id="title"
                name="title"
                placeholder="Approve the budget proposal"
                required
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-white/80"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Explain what members should consider before voting."
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="grid gap-2">
                <label htmlFor="tag" className="text-sm font-medium text-white/80">
                  Tag
                </label>
                <input
                  id="tag"
                  name="tag"
                  placeholder="General"
                  className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-white/80"
                >
                  Initial status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="active"
                  className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Eligible levels
              </legend>
              <p className="text-sm text-white/50">
                Participants in these levels can see and vote on this ballot.
              </p>
              {renderLevelCheckboxes(levels, "eligibleLevelIds")}
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Live results visibility
              </legend>
              <p className="text-sm text-white/50">
                Choose who can see results while the vote is still active.
              </p>
              {renderLevelCheckboxes(levels, "liveResultLevelIds")}
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Final results visibility
              </legend>
              <p className="text-sm text-white/50">
                Choose who can see results after the vote is closed.
              </p>
              {renderLevelCheckboxes(levels, "finalResultLevelIds")}
            </fieldset>
          </div>

          <button
            type="submit"
            disabled={!hasLevels}
            className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create vote
          </button>
        </form>
      </div>

      <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl text-white">Current votes</h3>
            <p className="mt-2 text-sm text-white/60">
              Review the audiences and result visibility rules attached to each
              published vote.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
            Newest first
          </span>
        </div>

        {votes.length > 0 ? (
          <div className="mt-6 grid gap-3">
            {votes.map((vote) => {
              const createdAt = formatDate(vote.created_at);

              return (
                <article
                  key={vote.id}
                  className="rounded-2xl border border-white/10 bg-[#0b1018] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {vote.title}
                        </h4>
                        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                          {vote.tag}
                        </span>
                      </div>
                      {vote.description ? (
                        <p className="mt-2 text-sm text-white/60">
                          {vote.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
                        {vote.status}
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
                        Eligible audience
                      </dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {getLevelNames(vote.eligible_level_ids, levelsById).map((name) => (
                          <span
                            key={`${vote.id}-eligible-${name}`}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                          >
                            {name}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                        Live results
                      </dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {getLevelNames(vote.live_result_level_ids, levelsById).map((name) => (
                          <span
                            key={`${vote.id}-live-${name}`}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                          >
                            {name}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                        Final results
                      </dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {getLevelNames(vote.final_result_level_ids, levelsById).map((name) => (
                          <span
                            key={`${vote.id}-final-${name}`}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                          >
                            {name}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-white/55">
            No votes have been created for this organization yet.
          </div>
        )}
      </article>
    </section>
  );
}
