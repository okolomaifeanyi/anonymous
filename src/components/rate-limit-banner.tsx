"use client";

import { useEffect, useState } from "react";

type RateLimitBannerProps = {
  id?: string;
  className?: string;
  prefix: string;
  suffix: string;
  initialSeconds: number;
};

export default function RateLimitBanner({
  id,
  className,
  prefix,
  suffix,
  initialSeconds,
}: RateLimitBannerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

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

  if (secondsRemaining <= 0) {
    return null;
  }

  return (
    <p
      id={id}
      className={className}
      role="alert"
      aria-live="assertive"
    >
      {prefix}
      {secondsRemaining}
      {suffix}
    </p>
  );
}
