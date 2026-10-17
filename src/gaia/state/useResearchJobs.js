import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The background research Gaia put out at Hermes.
 *
 * A research turn is answered immediately; the findings arrive later, written
 * into the conversation by the server. So the UI cannot learn about them from
 * the turn — it asks. A plain poll rather than a subscription, because a run
 * outlives the window, the reconnect and the app itself: the queue survives,
 * the connection does not.
 *
 * Ported from Gaia Desktop (desktop/src/state/useResearchJobs.js) so both
 * clients behave the same. Every failure is silent and keeps the last known
 * state. `onFinished` fires once per finished job — the caller reads the
 * conversation the findings were written into and then acknowledges — and a
 * run parked on a command simply waits until the person answers it.
 */
export function useResearchJobs(api, { onFinished, intervalMs = 8000 } = {}) {
  const [queue, setQueue] = useState({ running: [], awaiting: [], finished: [] });
  const handledRef = useRef(new Set());
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  const refresh = useCallback(async () => {
    try {
      const next = await api.queued();
      setQueue(next);
      return next;
    } catch (_) {
      // Silent on purpose: the server may be restarting, or the tab may be
      // waking up. Keep what we last knew instead of flashing an error about
      // work nobody is waiting on.
      return null;
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await refresh();
      if (cancelled || !next || typeof finishedRef.current !== 'function') return;
      for (const job of next.finished) {
        if (handledRef.current.has(job.id)) continue;
        handledRef.current.add(job.id);
        try {
          await finishedRef.current(job);
        } catch (_) {
          // A failed delivery is retried on the next poll, so the marker is
          // dropped rather than swallowing the findings.
          handledRef.current.delete(job.id);
        }
      }
    };
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refresh, intervalMs]);

  const answer = useCallback(async (id, choice) => {
    await api.approval(id, choice);
    await refresh();
  }, [api, refresh]);

  const ack = useCallback(async (id) => {
    await api.ack(id);
    setQueue((prev) => ({ ...prev, finished: prev.finished.filter((job) => job.id !== id) }));
  }, [api]);

  return { ...queue, refresh, answer, ack };
}
