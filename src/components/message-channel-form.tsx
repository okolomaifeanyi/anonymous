"use client";

import { useState } from "react";

import type {
  MessageChannelRevealAudienceType,
} from "@/lib/feedback/types";
import type { OrganizationLevel } from "@/lib/feedback/participants";
import SubmitButton from "@/components/ui/submit-button";

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
  participantRevealSupported: boolean;
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
  participantRevealSupported,
}: MessageChannelFormProps) {
  const [revealAudienceType, setRevealAudienceType] =
    useState<MessageChannelRevealAudienceType>("levels");
  const hasParticipants = participants.length > 0;
  const participantRevealAvailable = hasParticipants;

  return (
    <form action={action} className="rounded-3xl border border-white/10 bg-[#0f141d] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl text-white">
            Create channel
          </h3>
          <p className="mt-2 text-sm text-white/60">
            Choose who submits and who sees reveals.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
          {hasLevels ? "Ready" : "Levels needed"}
        </span>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-medium text-white/80">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
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
            required
            className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
          />
        </div>

        <div className="grid gap-2 sm:max-w-[240px]">
          <label htmlFor="status" className="text-sm font-medium text-white/80">
            Status
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
            Submit audience
          </legend>
          <p className="text-sm text-white/50">
            People in these levels can submit.
          </p>
          {renderLevelCheckboxes(levels)}
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-white/80">
            Reveal audience
          </legend>
          <p className="text-sm text-white/50">
            Choose who sees revealed messages.
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
                <span className="block font-medium text-white">Levels</span>
                <span className="mt-1 block text-xs text-white/55">
                  Everyone in the selected levels sees it.
                </span>
              </span>
            </label>

            <label
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                revealAudienceType === "participants"
                  ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                  : "border-white/10 bg-[#0b1018] text-white/75"
              } ${participantRevealAvailable ? "" : "opacity-60"}`}
            >
              <input
                type="radio"
                name="revealAudienceType"
                value="participants"
                checked={revealAudienceType === "participants"}
                onChange={() => setRevealAudienceType("participants")}
                disabled={!participantRevealAvailable}
                className="mt-0.5 h-4 w-4 border-white/20 bg-transparent accent-cyan-300 disabled:cursor-not-allowed"
              />
              <span>
                <span className="block font-medium text-white">Participants</span>
                <span className="mt-1 block text-xs text-white/55">
                  Only the selected people see it.
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
                People in these levels can see reveals.
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
                Select one or more people.
              </p>
              {hasParticipants ? (
                participantRevealSupported ? (
                  renderRevealParticipantCheckboxes(participants)
                ) : (
                  <p className="rounded-2xl border border-dashed border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Participant reveals need the updated database schema.
                  </p>
                )
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                  No participants yet.
                </p>
              )}
            </fieldset>
          ) : null}
        </fieldset>
      </div>

      <SubmitButton
        label="Create"
        pendingLabel="Creating..."
        disabled={!hasLevels}
        className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#0b0f15] transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </form>
  );
}
