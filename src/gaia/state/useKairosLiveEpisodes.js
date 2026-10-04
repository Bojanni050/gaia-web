/**
 * Live Kairos episodes over SSE (gaia-api's `kairos/episodes/stream`).
 *
 * Returns the episodes that arrived since mount (newest first) plus a live
 * connection state for the status indicator. Deliberately additive: the
 * timeline still loads its history over REST (episodeApi.list), so a dropped
 * stream degrades to "no live arrivals", never a broken list.
 */
import { useEffect, useState } from 'react';
import { subscribeEpisodes } from '../server/api';

export function useKairosLiveEpisodes() {
  const [episodes, setEpisodes] = useState([]);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const unsubscribe = subscribeEpisodes(
      (episode) => {
        if (!episode || !episode.id) return;
        setEpisodes((prev) => {
          if (prev.some((e) => e.id === episode.id)) return prev;
          return [episode, ...prev];
        });
      },
      { onStatus: setStatus },
    );
    return () => unsubscribe();
  }, []);

  return { episodes, status };
}
