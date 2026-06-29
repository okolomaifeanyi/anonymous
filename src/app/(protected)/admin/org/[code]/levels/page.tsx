import { requireOwnedOrganization } from "@/lib/feedback/organizations";
import { getOrganizationLevels } from "@/lib/feedback/participants";
import SubmitButton from "@/components/ui/submit-button";

import { addLevel } from "./actions";

type LevelsPageProps = {
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

export default async function AdminOrganizationLevelsPage({
  params,
  searchParams,
}: LevelsPageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const organization = await requireOwnedOrganization(code);
  const levels = await getOrganizationLevels(organization.id);
  const action = addLevel.bind(null, code);
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid gap-6">
        <article className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-amber-600 dark:text-amber-200/70">
            Audience structure
          </p>
          <h2 className="mt-3 font-heading text-2xl text-foreground">Levels</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Levels control who can vote, send messages, and see results.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/50 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                Total levels
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground/80">
                {levels.length}
              </dd>
            </div>
            <div className="rounded-2xl border border-border bg-muted/50 p-4">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                Identifier rule
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground/80">
                {organization.participant_identifier_label}
              </dd>
            </div>
          </dl>
        </article>

        <form
          action={action}
          className="rounded-3xl border border-border bg-[var(--app-surface)] p-6"
        >
            <div>
              <h3 className="font-heading text-xl text-foreground">Add level</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a level.
            </p>
          </div>

          {status === "level-added" ? (
            <p
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
              role="status"
            >
              Level added successfully.
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground/80">
              Level name
            </label>
            <input
              id="name"
              name="name"
              required
              className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-border/60"
            />
          </div>

          <SubmitButton
            label="Add level"
            pendingLabel="Adding..."
            className="mt-6 inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      </div>

      <article className="rounded-3xl border border-border bg-[var(--app-surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl text-foreground">Current levels</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Used across rooms, votes, and messages.
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Ordered
          </span>
        </div>

        {levels.length > 0 ? (
          <div className="mt-6 grid gap-3">
            {levels.map((level, index) => {
              const createdAt = formatDate(level.created_at);

              return (
                <article
                  key={level.id}
                  className="rounded-2xl border border-border bg-[var(--app-card)] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {level.name}
                      </h4>
                      <p className="mt-1 font-mono text-xs text-muted-foreground/70">
                        {level.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-amber-700 dark:text-amber-100">
                        Position {index + 1}
                      </span>
                      {createdAt ? (
                        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-muted-foreground/70">
                          Added {createdAt}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/50 px-5 py-6 text-sm text-muted-foreground">
            No levels yet.
          </div>
        )}
      </article>
    </section>
  );
}
