/**
 * Cognition review — the human Absolute Override, inline in the sidebar like
 * History. These are the derived statements Logos is still weighing
 * (hypotheses, candidate models, open questions, relationships); the person
 * confirms one or lets it go. Only this verdict reaches `confirmed` — no
 * model, no accumulation of evidence on its own. The list loads lazily on
 * first expand, never at launch.
 *
 * Each row renders as an EpistemicReviewCard: evidence and the quarantined
 * counter-hypothesis can be opened, and a macro statement additionally demands
 * a conscious implication choice before Confirm unlocks. The web client reads
 * gaia-api's flat JSON, so cognitionApi returns the parsed body directly.
 *
 * Three tabs, one list each: "To review" (what still waits for a verdict),
 * "Confirmed" (the person's own record of what was settled) and "Reconsider"
 * (what was let go — a hard quarantine whose only way back is a stated reason,
 * so it is a list of its own instead of a form sitting in the middle of the
 * cards that still ask something). All three are filled from the one list the
 * server returns, so switching never costs a round trip.
 */
import React, { useMemo, useState } from 'react';
import { ChevronRight, Lightbulb } from 'lucide-react';
import { cognitionApi } from '../server/api';
import { L } from '../lib/lexicon';
import EpistemicReviewCard from './EpistemicReviewCard';

// The section's three lists. `review` is everything that is neither settled nor
// let go — what still waits for a verdict; `confirmed` is the person's own
// record; `reopen` is the rejected quarantine.
const TAB_REVIEW = 'review';
const TAB_CONFIRMED = 'confirmed';
const TAB_REOPEN = 'reopen';
const TAB_ORDER = [TAB_REVIEW, TAB_CONFIRMED, TAB_REOPEN];

/** The one place that decides which list a statement belongs to. */
const listOf = (item) =>
  item.status === 'rejected' ? TAB_REOPEN : item.status === 'confirmed' ? TAB_CONFIRMED : TAB_REVIEW;

/**
 * gaia-api serves what is under review as a round (reviewRound.js): at most a
 * handful of statements that carry weight (macro, or a counter-hypothesis) and
 * have built up enough evidence. The rest is not hidden away for good — it
 * waits for a later round, and is only counted here. A server that sends no
 * round (`in_round` absent) shows everything, as before.
 */
const isWaiting = (item) => listOf(item) === TAB_REVIEW && item.in_round === false;

export default function ReviewSection() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = not loaded yet
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState(TAB_REVIEW);

  const load = () =>
    cognitionApi
      .list()
      .then(setItems)
      .catch(() => {
        setItems([]);
        setError(L.cognitionLoadFailed);
      });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) load();
  };

  const afterAction = (id, updated) => {
    setItems((prev) => (prev || []).map((it) => (it.id === id ? { ...it, ...(updated || {}) } : it)));
  };

  const run = async (item, action, apply) => {
    if (busyId) return;
    setBusyId(item.id);
    setError(null);
    try {
      const response = await action();
      apply(response);
    } catch (_) {
      setError(L.cognitionActionFailed);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = (item, { rationale, statement } = {}) =>
    run(item, () => cognitionApi.confirm(item.id, { rationale, statement }),
      (response) => afterAction(item.id, { ...(response || {}), status: 'confirmed' }));

  const handleReject = (item) =>
    run(item, () => cognitionApi.reject(item.id, L.cognitionRejected),
      () => afterAction(item.id, { status: 'rejected' }));

  const handleTest = (item) =>
    run(item, () => cognitionApi.test(item.id),
      (response) => afterAction(item.id, { ...(response || {}), status: 'testing' }));

  const handleReopen = (item, reason) =>
    run(item, () => cognitionApi.reopen(item.id, reason),
      (response) => afterAction(item.id, { ...(response || {}), status: 'testing' }));

  // All three lists are views on the one fetch.
  const { lists, waiting } = useMemo(() => {
    const grouped = { [TAB_REVIEW]: [], [TAB_CONFIRMED]: [], [TAB_REOPEN]: [] };
    let waitingCount = 0;
    (items || []).forEach((item) => {
      if (isWaiting(item)) {
        waitingCount += 1;
        return;
      }
      grouped[listOf(item)].push(item);
    });
    return { lists: grouped, waiting: waitingCount };
  }, [items]);
  const shownItems = lists[tab];
  const tabCopy = {
    [TAB_REVIEW]: { label: L.cognitionTabReview, empty: L.cognitionEmpty },
    [TAB_CONFIRMED]: { label: L.cognitionTabConfirmed, empty: L.cognitionConfirmedEmpty },
    [TAB_REOPEN]: { label: L.cognitionTabReopen, empty: L.cognitionReopenEmpty },
  };

  return (
    <div className="sidebar-section">
      <button className="sidebar-section-header" onClick={toggle} aria-expanded={open}>
        <ChevronRight size={13} className={`sidebar-section-chevron${open ? ' open' : ''}`} />
        <Lightbulb size={13} />
        <span>{L.cognition}</span>
      </button>

      {open && (
        <div className="sidebar-section-body">
          {error && <div className="sidebar-section-error">{error}</div>}
          {items === null ? (
            <p className="sidebar-section-hint">{L.cognitionLoading}</p>
          ) : (
            <>
              <div className="cognition-tabs" role="tablist" aria-label={L.cognition}>
                {TAB_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`cognition-tab-${id}`}
                    aria-controls="cognition-tabpanel"
                    aria-selected={tab === id}
                    className={`cognition-tab${tab === id ? ' active' : ''}`}
                    onClick={() => setTab(id)}
                  >
                    {tabCopy[id].label}
                    {lists[id].length > 0 && <span className="cognition-tab-count">{lists[id].length}</span>}
                  </button>
                ))}
              </div>
              <div
                className="cognition-tabpanel"
                id="cognition-tabpanel"
                role="tabpanel"
                aria-labelledby={`cognition-tab-${tab}`}
              >
                {shownItems.length === 0 ? (
                  <p className="sidebar-section-hint">{tabCopy[tab].empty}</p>
                ) : (
                  <>
                    {tab === TAB_REVIEW && <p className="sidebar-section-hint">{L.cognitionHint}</p>}
                    {shownItems.map((item) => (
                      <EpistemicReviewCard
                        key={item.id}
                        item={item}
                        busy={busyId === item.id}
                        onConfirm={handleConfirm}
                        onReject={handleReject}
                        onTest={handleTest}
                        onReopen={handleReopen}
                      />
                    ))}
                  </>
                )}
                {tab === TAB_REVIEW && waiting > 0 && (
                  <p className="sidebar-section-hint">{L.cognitionWaiting.replace('{n}', String(waiting))}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
