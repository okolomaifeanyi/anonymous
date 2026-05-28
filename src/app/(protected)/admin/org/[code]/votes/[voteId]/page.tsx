import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { getOrganizationLevels } from "@/lib/feedback/participants";
import { getVoteById } from "@/lib/feedback/votes";

import { editVote, removeVote } from "../actions";
import VoteFormFields from "../vote-form-fields";

type VoteEditorPageProps = {
  params: Promise<{ code: string; voteId: string }>;
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

export default async function AdminOrganizationVoteEditorPage({
  params,
  searchParams,
}: VoteEditorPageProps) {
  const [{ code, voteId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await requireOwnedOrganization(code);
  const vote = await getVoteById(organization.id, voteId).catch((error) => {
    if (error instanceof Error && error.message === "Vote not found.") {
      notFound();
    }

    throw error;
  });

  const levels = await getOrganizationLevels(organization.id);
  const action = editVote.bind(null, code, voteId);
  const deleteAction = removeVote.bind(null, code, voteId);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const createdAt = formatDate(vote.created_at);
  const hasLevels = levels.length > 0;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="grid gap-6">
        <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
            Vote editor
          </p>
          <h2 className="mt-3 font-heading text-2xl text-white">{vote.title}</h2>
          <p className="mt-3 text-sm text-white/65">
            Update the ballot details, image, and audience rules, or delete it
            entirely if it is no longer needed.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Current status
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {vote.status}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Added
              </dt>
              <dd className="mt-2 text-sm font-medium text-white/85">
                {createdAt ?? "Unknown"}
              </dd>
            </div>
          </dl>

          {vote.image_url ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vote.image_url}
                alt={vote.title}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/admin/org/${code}/votes`}
              className="button-surface inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition"
            >
              Back to votes
            </Link>
            <form action={deleteAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
              >
                Delete vote
              </button>
            </form>
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl text-white">Edit vote</h3>
            <p className="mt-2 text-sm text-white/60">
              Adjust how this ballot appears and who can participate.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
            {hasLevels ? "Ready" : "Levels required"}
          </span>
        </div>

        {status === "vote-updated" ? (
          <p
            className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            role="status"
          >
            Vote updated successfully.
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
            Add at least one audience level before editing votes.
          </div>
        ) : null}

        <form action={action}>
          <VoteFormFields
            levels={levels}
            vote={vote}
            submitLabel="Save changes"
            disabled={!hasLevels}
          />
        </form>
      </article>
    </section>
  );
}
