"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function useCountdown(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const intervalRef = useRef<number | null>(null);

  const isActive = timeLeft > 0;

  const clear = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    clear();
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
  }, [clear]);

  const reset = useCallback(
    (seconds: number = initialSeconds) => {
      setTimeLeft(seconds);
    },
    [initialSeconds]
  );

  const restart = useCallback(
    (seconds: number = initialSeconds) => {
      reset(seconds);
      start();
    },
    [initialSeconds, reset, start]
  );

  useEffect(() => () => clear(), [clear]);

  const formatted = useMemo(() => formatSeconds(timeLeft), [timeLeft]);

  return { timeLeft, formatted, isActive, start, reset, restart, clear };
}

