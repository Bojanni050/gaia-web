/**
 * KairosSection — the episodes Kairos recognised, as a collapsible sidebar
 * section (same shape as ReviewSection/HistorySection). Loads history lazily on
 * first expand over REST (episodeApi.list) and merges in live arrivals from the
 * SSE stream (useKairosLiveEpisodes), de-duplicated by id, newest first.
 *
 * Interpretations first: each card's raw evidence sits collapsed beneath it and
 * loads on request. A live status dot reflects the real stream state.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { episodeApi } from '../server/api';
import { L } from '../lib/lexicon';
import { adaptKairosEpisode } from './adaptEpisode';
import { useKairosLiveEpisodes } from '../state/useKairosLiveEpisodes';
import EpisodeCard from './EpisodeCard';

export default function KairosSection() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = not loaded yet
  const [error, setError] = useState(null);
  const { episodes: live, status } = useKairosLiveEpisodes();

  useEffect(() => {
    if (!open || items !== null) return;
    episodeApi
      .list()
      .then(setItems)
      .catch(() => { setItems([]); setError(L.logosLoadFailed); });
  }, [open, items]);

  const merged = useMemo(() => {
    const base = items || [];
    const seen = new Set(base.map((e) => e.id));
    const fresh = live.map(adaptKairosEpisode).filter((e) => e && !seen.has(e.id));
    return [...fresh, ...base];
  }, [items, live]);

  const statusLabel =
    status === 'connected' ? L.logosLive : status === 'offline' ? L.logosOffline : L.logosConnecting;

  return (
    <div className="sidebar-section">
      <button className="sidebar-section-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronRight size={13} className={`sidebar-section-chevron${open ? ' open' : ''}`} />
        <Clock size={13} />
        <span>{L.logos}</span>
        <span className={`kairos-live-dot ${status}`} aria-label={statusLabel} title={statusLabel} />
      </button>

      {open && (
        <div className="sidebar-section-body">
          {error && <div className="sidebar-section-error">{error}</div>}
          {items === null ? (
            <p className="sidebar-section-hint">{L.logosLoading}</p>
          ) : merged.length === 0 ? (
            <p className="sidebar-section-hint">{L.logosEmpty}</p>
          ) : (
            merged.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} loadEvidence={episodeApi.evidence} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
