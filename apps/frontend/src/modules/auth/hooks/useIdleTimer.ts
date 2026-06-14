import { useEffect, useRef, useState } from "react";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

/** No se procesa la actividad mas de una vez por segundo para evitar reprogramar timers en exceso. */
const ACTIVITY_THROTTLE_MS = 1000;

type UseIdleTimerOptions = {
  enabled: boolean;
  timeoutMs: number;
  warningMs?: number;
  keepAliveMs?: number;
  onIdle: () => void;
  onWarning?: () => void;
  onActivity?: () => void;
};

export function useIdleTimer({
  enabled,
  timeoutMs,
  warningMs,
  keepAliveMs,
  onIdle,
  onWarning,
  onActivity,
}: UseIdleTimerOptions) {
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);
  const lastResetRef = useRef(0);
  const lastKeepAliveRef = useRef(0);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    enabled ? Math.ceil(timeoutMs / 1000) : null,
  );

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) {
      return;
    }

    const clearTimers = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current !== null) {
        window.clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };

    const updateCountdown = () => {
      const nextValue = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setRemainingSeconds((currentValue) =>
        currentValue === nextValue ? currentValue : nextValue,
      );
    };

    const scheduleTimers = () => {
      clearTimers();
      deadlineRef.current = Date.now() + timeoutMs;
      updateCountdown();

      if (onWarning && warningMs && warningMs < timeoutMs) {
        warningTimerRef.current = window.setTimeout(
          onWarning,
          timeoutMs - warningMs,
        );
      }

      idleTimerRef.current = window.setTimeout(() => {
        setRemainingSeconds(0);
        onIdle();
      }, timeoutMs);
      countdownTimerRef.current = window.setInterval(updateCountdown, 1000);
    };

    const handleActivity = () => {
      const now = Date.now();

      if (now - lastResetRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }
      lastResetRef.current = now;

      if (
        onActivity &&
        keepAliveMs &&
        now - lastKeepAliveRef.current >= keepAliveMs
      ) {
        lastKeepAliveRef.current = now;
        onActivity();
      }

      scheduleTimers();
    };

    scheduleTimers();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true }),
    );

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
    };
  }, [
    enabled,
    timeoutMs,
    warningMs,
    keepAliveMs,
    onIdle,
    onWarning,
    onActivity,
  ]);

  return {
    remainingSeconds: enabled ? remainingSeconds : null,
  };
}
