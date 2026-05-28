"use client";

import { useState } from "react";

import type {
  MessageChannelRevealAudienceType,
} from "@/lib/feedback/types";
import type { OrganizationLevel } from "@/lib/feedback/participants";

type MessageChannelFormParticipant = {
  id: string;
  label: string;
  description: string;
};

type MessageChannelFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  levels: OrganizationLevel[];
  participants: MessageChannelFormParticipant[];
  hasLevels: boolean;
};

function renderLevelCheckboxes(levels: OrganizationLevel[]) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {levels.map((level) => (
        <label
          key={`submit-${level.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
        >
          <input
            type="checkbox"
            name="submitLevelIds"
            value={level.id}
            className="h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-emerald-300"
          />
          <span>{level.name}</span>
        </label>
      ))}
    </div>
  );
}

function renderRevealLevelCheckboxes(levels: OrganizationLevel[]) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {levels.map((level) => (
        <label
          key={`reveal-level-${level.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
        >
          <input
            type="checkbox"
            name="revealLevelIds"
            value={level.id}
            className="h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-cyan-300"
          />
          <span>{level.name}</span>
        </label>
      ))}
    </div>
  );
}

function renderRevealParticipantCheckboxes(
  participants: MessageChannelFormParticipant[],
) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {participants.map((participant) => (
        <label
          key={`reveal-participant-${participant.id}`}
          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
        >
          <input
            type="checkbox"
            name="revealParticipantIds"
            value={participant.id}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0b1018] accent-cyan-300"
          />
          <span>
            <span className="block font-medium text-white">
              {participant.label}
            </span>
            <span className="mt-1 block text-xs text-white/45">
              {participant.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function MessageChannelForm({
  action,
  levels,
  participants,
  hasLevels,
}: MessageChannelFormProps) {
  const [revealAudienceType, setRevealAudienceType] =
    useState<MessageChannelRevealAudienceType>("levels");
  const hasParticipants = participants.length > 0;

  return (
    <form action={action} className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl text-white">
            Create message channel
          </h3>
          <p className="mt-2 text-sm text-white/60">
            Define who can submit notes and who can see revealed messages for
            the channel.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
          {hasLevels ? "Ready" : "Levels required"}
        </span>
      </div>

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
          <label htmlFor="prompt" className="text-sm font-medium text-white/80">
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
          <label htmlFor="status" className="text-sm font-medium text-white/80">
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
          {renderLevelCheckboxes(levels)}
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-white/80">
            Reveal audience
          </legend>
          <p className="text-sm text-white/50">
            Choose whether revealed messages are visible to selected levels or
            only selected approved participants.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                revealAudienceType === "levels"
                  ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                  : "border-white/10 bg-[#0b1018] text-white/75"
              }`}
            >
              <input
                type="radio"
                name="revealAudienceType"
                value="levels"
                checked={revealAudienceType === "levels"}
                onChange={() => setRevealAudienceType("levels")}
                className="mt-0.5 h-4 w-4 border-white/20 bg-transparent accent-cyan-300"
              />
              <span>
                <span className="block font-medium text-white">
                  Selected levels
                </span>
                <span className="mt-1 block text-xs text-white/55">
                  Everyone in the chosen level groups can view the reveal.
                </span>
              </span>
            </label>

            <label
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                revealAudienceType === "participants"
                  ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                  : "border-white/10 bg-[#0b1018] text-white/75"
              } ${hasParticipants ? "" : "opacity-60"}`}
            >
              <input
                type="radio"
                name="revealAudienceType"
                value="participants"
                checked={revealAudienceType === "participants"}
                onChange={() => setRevealAudienceType("participants")}
                disabled={!hasParticipants}
                className="mt-0.5 h-4 w-4 border-white/20 bg-transparent accent-cyan-300 disabled:cursor-not-allowed"
              />
              <span>
                <span className="block font-medium text-white">
                  Selected participants
                </span>
                <span className="mt-1 block text-xs text-white/55">
                  Only the approved people below can see the revealed message.
                </span>
              </span>
            </label>
          </div>

          {revealAudienceType === "levels" ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Reveal levels
              </legend>
              <p className="text-sm text-white/50">
                Participants in these levels can see revealed entries.
              </p>
              {renderRevealLevelCheckboxes(levels)}
            </fieldset>
          ) : null}

          {revealAudienceType === "participants" ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-white/80">
                Reveal participants
              </legend>
              <p className="text-sm text-white/50">
                Select one or more approved participants from this organization.
              </p>
              {hasParticipants ? (
                renderRevealParticipantCheckboxes(participants)
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                  No approved participants are available yet.
                </p>
              )}
            </fieldset>
          ) : null}
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
  );
}
