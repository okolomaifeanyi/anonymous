"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type CooldownSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className: string;
  initialCooldown?: number;
};

export default function CooldownSubmitButton({
  label,
  pendingLabel,
  className,
  initialCooldown = 0,
}: CooldownSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [secondsRemaining, setSecondsRemaining] = useState(initialCooldown);

  useEffect(() => {
    setSecondsRemaining(initialCooldown);
  }, [initialCooldown]);

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

  const isCooldownActive = secondsRemaining > 0;
  const isDisabled = pending || isCooldownActive;
  const buttonLabel = pending
    ? pendingLabel
    : isCooldownActive
      ? `Wait ${secondsRemaining}s to resend`
      : label;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-live="polite"
      aria-busy={pending || undefined}
      className={className}
    >
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : null}
        {buttonLabel}
      </span>
    </button>
  );
}
