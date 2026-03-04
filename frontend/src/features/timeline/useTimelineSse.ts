import { useEffect, useRef, useState } from "react";
import { connectSse, SseHttpError } from "./sseClient";
import { authStore } from "../../auth/authStore";
import { refreshToken } from "../../api/client";

export type SseEnvelopeV1<T = any> = {
  v: number;
  id: string;
  ts: string;
  orgId: string;
  type: string;
  data: T;
};

export function useTimelineSse(opts: { enabled: boolean }) {
  const { enabled } = opts;

  const [status, setStatus] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SseEnvelopeV1[]>([]);

  const stopRef = useRef<null | (() => void)>(null);
  // Use a ref so callbacks inside connectSse always see the latest values
  const stoppedRef = useRef(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    stoppedRef.current = false;
    attemptRef.current = 0;

    function scheduleReconnect(delayMs: number) {
      setTimeout(() => {
        if (!stoppedRef.current) connect();
      }, delayMs);
    }

    function connect() {
      if (stoppedRef.current) return;

      const token = authStore.getAccessToken();
      if (!token) {
        setStatus("error");
        setError("Missing access token");
        return;
      }

      setStatus("connecting");
      setError(null);

      connectSse(
        "/api/v1/sse/timeline",
        { Authorization: `Bearer ${token}` },
        {
          onOpen: () => {
            attemptRef.current = 0;
            setStatus("open");
          },

          onEvent: ({ event, data }) => {
            try {
              const env = JSON.parse(data) as SseEnvelopeV1;
              setEvents((prev) => [env, ...prev].slice(0, 200));
            } catch {
              console.warn("Non-JSON SSE message", event, data);
            }
          },

          onError: (e) => {
            if (stoppedRef.current) return;

            if (e instanceof SseHttpError && e.status === 403) {
              setStatus("error");
              setError("Access denied (403)");
              return; // permissions won't change — don't reconnect
            }

            if (e instanceof SseHttpError && e.status === 401) {
              // Token expired mid-stream: refresh then reconnect immediately
              refreshToken()
                .then(() => { if (!stoppedRef.current) connect(); })
                .catch(() => {
                  setStatus("error");
                  setError("Session expired — please log in again");
                });
              return;
            }

            // Network / server error: exponential backoff
            setStatus("error");
            setError(e instanceof Error ? e.message : String(e));
            const delay = Math.min(8000, 500 * Math.pow(2, attemptRef.current++));
            scheduleReconnect(delay);
          },

          onClose: () => {
            if (stoppedRef.current) {
              setStatus("closed");
              return;
            }
            // Server closed the stream (heartbeat timeout, deploy, etc.) — reconnect
            const delay = Math.min(8000, 500 * Math.pow(2, attemptRef.current++));
            scheduleReconnect(delay);
          },
        }
      ).then((conn) => {
        stopRef.current = conn.close;
      });
    }

    connect();

    return () => {
      stoppedRef.current = true;
      stopRef.current?.();
      stopRef.current = null;
      setStatus("closed");
    };
  }, [enabled]);

  return { status, error, events };
}
