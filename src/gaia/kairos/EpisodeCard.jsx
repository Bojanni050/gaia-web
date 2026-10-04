/**
 * EpisodeCard — one stretch of activity Kairos recognised, as a card.
 *
 * The epistemic separation the whole card exists for: the interpretation is the
 * loud, human sentence at the top; the raw observations capture-rs recorded are
 * quiet, collapsed, and only appear on request. The badge says "Episode /
 * Interpretation"; the evidence section says "raw observations" and notes that
 * Gaia did not write them.
 *
 * Evidence is loaded lazily through `loadEvidence(episode.id)` — the audit path
 * from interpretation down to fact.
 */
import React, { useState } from 'react';
import { ChevronRight, Clock, ScrollText, Sparkles } from 'lucide-react';
import { L } from '../lib/lexicon';

const pad = (n) => String(n).padStart(2, '0');

function clock(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function clockSeconds(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${clock(iso)}:${pad(d.getSeconds())}`;
}

export default function EpisodeCard({ episode, loadEvidence }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const context = Array.isArray(episode.context) ? episode.context : [];
  const inline = Array.isArray(episode.observations) ? episode.observations : [];
  const observations = loaded !== null ? loaded : inline;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && loaded === null && inline.length === 0 && typeof loadEvidence === 'function') {
      setBusy(true);
      setError(null);
      try {
        const rows = await loadEvidence(episode.id);
        setLoaded(Array.isArray(rows) ? rows : []);
      } catch (_) {
        setError(L.logosEvidenceFailed);
        setLoaded([]);
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <article className="kairos-card">
      <div className="kairos-card-head">
        <span className="kairos-time">
          <Clock size={12} aria-hidden="true" />
          {clock(episode.startTime)} – {clock(episode.endTime)}
        </span>
        <span className="kairos-badge" title={L.logosBadgeHint}>
          <Sparkles size={12} aria-hidden="true" />
          {L.logosEpisodeBadge}
        </span>
      </div>

      <p className="kairos-interpretation">{episode.interpretation}</p>

      {context.length > 0 && (
        <div className="kairos-chips">
          {context.map((item, index) => (
            <span key={`${item.application}-${index}`} className="kairos-chip">
              {item.application}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        className="kairos-evidence-toggle"
        aria-expanded={open}
        onClick={toggle}
      >
        <ScrollText size={14} aria-hidden="true" />
        <span>{L.logosEvidenceToggle}</span>
        {observations.length > 0 && (
          <span className="kairos-evidence-count">
            ({observations.length} {observations.length === 1 ? L.logosCapture : L.logosCaptures})
          </span>
        )}
        <ChevronRight size={13} className={`kairos-chevron${open ? ' open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <section className="kairos-evidence" aria-label={L.logosRawObservations}>
          <div className="kairos-raw-head">
            <span className="kairos-raw-title">{L.logosRawObservations}</span>
            <span className="kairos-raw-note">{L.logosRawNote}</span>
          </div>

          {busy && <p className="sidebar-section-hint">{L.logosLoading}</p>}
          {error && <div className="sidebar-section-error">{error}</div>}
          {!busy && !error && observations.length === 0 && (
            <p className="sidebar-section-hint">{L.logosEvidenceEmpty}</p>
          )}

          <ol className="kairos-observations">
            {observations.map((obs) => (
              <li key={obs.id} className="kairos-observation">
                <div className="kairos-observation-meta">
                  {obs.timestamp && <span className="kairos-obs-time">{clockSeconds(obs.timestamp)}</span>}
                  {obs.application && <span className="kairos-obs-app">{obs.application}</span>}
                </div>
                {obs.windowTitle && <span className="kairos-obs-window">{obs.windowTitle}</span>}
                {obs.ocrText && <pre className="kairos-ocr">{obs.ocrText}</pre>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
