"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  initialCooldown = 0,
}: {
  initialCooldown?: number;
}) {
  const { pending } = useFormStatus();
  const [secondsRemaining, setSecondsRemaining] = useState(initialCooldown);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [secondsRemaining]);

  const isDisabled = pending || secondsRemaining > 0;
  const label = pending
    ? "Sending..."
    : secondsRemaining > 0
      ? `Wait ${secondsRemaining}s to resend`
      : "Send magic link";

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-live="polite"
      className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b0f15] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {label}
    </button>
  );
}
