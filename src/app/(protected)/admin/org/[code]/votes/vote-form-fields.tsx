import type { OrganizationLevel } from "@/lib/feedback/participants";
import type { OrganizationVote } from "@/lib/feedback/votes";

type VoteFormFieldsProps = {
  levels: OrganizationLevel[];
  vote?: OrganizationVote;
  submitLabel: string;
  disabled: boolean;
};

function renderLevelCheckboxes(
  levels: OrganizationLevel[],
  name: "eligibleLevelIds" | "liveResultLevelIds" | "finalResultLevelIds",
  selectedLevelIds: string[] = [],
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
            defaultChecked={selectedLevelIds.includes(level.id)}
            className="h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-cyan-300"
          />
          <span>{level.name}</span>
        </label>
      ))}
    </div>
  );
}

export default function VoteFormFields({
  levels,
  vote,
  submitLabel,
  disabled,
}: VoteFormFieldsProps) {
  return (
    <div className="mt-6 grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-white/80">
          Vote title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={vote?.title ?? ""}
          required
          className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
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
          defaultValue={vote?.description ?? ""}
          className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="imageFile" className="text-sm font-medium text-white/80">
          Vote image
        </label>
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/*"
          className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0b0f15] hover:file:bg-cyan-100 focus:border-white/25"
        />
        {vote?.image_url ? (
          <p className="text-xs text-white/45">
            Current image is stored in Supabase Storage. Upload a new file to
            replace it.
          </p>
        ) : (
          <p className="text-xs text-white/45">
            Optional. Images are uploaded to Supabase Storage.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-2">
          <label htmlFor="tag" className="text-sm font-medium text-white/80">
            Tag
          </label>
          <input
            id="tag"
            name="tag"
            defaultValue={vote?.tag ?? ""}
            className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-medium text-white/80">
            Initial status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={vote?.status ?? "active"}
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
        {renderLevelCheckboxes(
          levels,
          "eligibleLevelIds",
          vote?.eligible_level_ids ?? [],
        )}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-white/80">
          Live results visibility
        </legend>
        <p className="text-sm text-white/50">
          Choose who can see results while the vote is still active.
        </p>
        {renderLevelCheckboxes(
          levels,
          "liveResultLevelIds",
          vote?.live_result_level_ids ?? [],
        )}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-white/80">
          Final results visibility
        </legend>
        <p className="text-sm text-white/50">
          Choose who can see results after the vote is closed.
        </p>
        {renderLevelCheckboxes(
          levels,
          "finalResultLevelIds",
          vote?.final_result_level_ids ?? [],
        )}
      </fieldset>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  );
}
