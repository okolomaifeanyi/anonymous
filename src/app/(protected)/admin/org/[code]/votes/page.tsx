import Link from "next/link";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import {
  getOrganizationLevels,
  type OrganizationLevel,
} from "@/lib/feedback/participants";
import { listVotes } from "@/lib/feedback/votes";

import { addVote } from "./actions";
import VoteFormFields from "./vote-form-fields";

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

          {status === "vote-created" || status === "vote-deleted" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              {status === "vote-created"
                ? "Vote created successfully."
                : "Vote deleted successfully."}
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

          <VoteFormFields
            levels={levels}
            submitLabel="Create vote"
            disabled={!hasLevels}
          />
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
                  {vote.image_url ? (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vote.image_url}
                        alt={vote.title}
                        loading="lazy"
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  ) : null}

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
                      <Link
                        href={`/admin/org/${code}/votes/${vote.id}`}
                        className="button-surface px-3 py-1 text-cyan-100 transition hover:text-cyan-100"
                      >
                        Edit
                      </Link>
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
