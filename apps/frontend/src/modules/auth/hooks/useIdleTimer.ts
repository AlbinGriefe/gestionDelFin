import { useEffect, useRef } from "react";

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
  const lastResetRef = useRef(0);
  const lastKeepAliveRef = useRef(0);

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
    };

    const scheduleTimers = () => {
      clearTimers();

      if (onWarning && warningMs && warningMs < timeoutMs) {
        warningTimerRef.current = window.setTimeout(
          onWarning,
          timeoutMs - warningMs,
        );
      }

      idleTimerRef.current = window.setTimeout(onIdle, timeoutMs);
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
}
