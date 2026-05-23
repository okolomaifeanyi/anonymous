"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b0f15] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Sending..." : "Send magic link"}
    </button>
  );
}
