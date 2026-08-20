import { useCallback, useEffect, useRef, useState } from 'react';
import { getReasoningProvider } from '../integration/reasoning';
import { phraseReasoningError } from '../presence/errorPhrases';
import { interpretIntent, reasonAboutTurn } from '../logos';

const emptyStream = { active: false, messageId: null, content: '', reasoning: '', presence: 'quiet' };
const PRESENCE_THINKING = 'thinking';
const PRESENCE_SPEAKING = 'speaking';

function makeId() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFrom(text) {
  const t = (text || '').trim();
  if (!t) return 'A new page';
  return t.split(/\s+/).slice(0, 7).join(' ').slice(0, 60);
}

/**
 * Development-only visibility into Logos's full cognitive loop for this
 * turn: intentIQ's IntentDecision, then reasonIQ's ReasoningResult
 * constructed from it. This milestone establishes both seams (user message
 * → intentIQ → IntentDecision → reasonIQ → ReasoningResult → existing Gaia
 * response flow) without changing routing or the response itself — see
 * docs/evolution.md. Fire-and-forget and non-blocking: neither faculty
 * throws (both fail safe internally), and this must never affect or delay
 * the conversation.
 *
 * Deliberately does not pass recalled memory into reasonAboutTurn here —
 * doing so would mean either a second Hindsight recall call (the real one
 * now happens server-side, inside gaia-api's performStreamingTurn, gated
 * by its own memoryPolicy — docs/web-migration-plan.md Phase B/C) or a
 * larger refactor of the turn lifecycle than this milestone calls for.
 * reasonIQ fully supports consuming recalled memory (see
 * reasonIQ.test.js); wiring that into this dev-log path is left for when
 * reasonIQ starts driving real behavior rather than being inspected in
 * isolation.
 */
function logLogosForDev(messages) {
  if (process.env.NODE_ENV === 'production') return;
  interpretIntent(messages).then((decision) => {
    // eslint-disable-next-line no-console
    console.debug('[Logos:intentIQ]', decision);
    return reasonAboutTurn(decision, messages).then((result) => {
      // eslint-disable-next-line no-console
      console.debug('[Logos:reasonIQ]', result);
    });
  });
}

/**
 * useConversation — Gaia's conversational state, in memory.
 */
export function useConversation() {
  const provider = useRef(getReasoningProvider()).current;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [byConv, setByConv] = useState({});
  const [stream, setStream] = useState(emptyStream);
  const [health, setHealth] = useState({ status: 'unknown' });

  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    provider.health().then((h) => {
      if (cancelled) return;
      setHealth({ status: h.ok ? 'ready' : 'unreachable', detail: h.detail });
    }).catch(() => {
      if (cancelled) return;
      setHealth({ status: 'unreachable', detail: 'cannot reach reason engine' });
    });
    return () => { cancelled = true; };
  }, [provider]);

  // Refs so the poll below can read current state without re-creating its
  // interval on every message/stream tick.
  const activeIdRef = useRef(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  const byConvRef = useRef({});
  useEffect(() => { byConvRef.current = byConv; }, [byConv]);
  const streamActiveRef = useRef(false);
  useEffect(() => { streamActiveRef.current = stream.active; }, [stream.active]);

  /**
   * Resumes whichever conversation gaia-api considers most recently
   * updated (newest-first list) if it differs from what's open here.
   * Called once on load and then on a poll interval, so switching between
   * gaia-web and gaia-desktop picks up whatever the *other* client most
   * recently did — there is no push channel between clients, so this poll
   * is the whole "shared session" mechanism for now.
   *
   * Two guards keep it from clobbering local, not-yet-saved state:
   *   - a turn in flight here is never interrupted
   *   - a conversation just started via "New page" (no messages sent yet,
   *     so it isn't in gaia-api's list at all) is left alone rather than
   *     being silently replaced by whatever another client last touched
   */
  const syncMostRecentConversation = useCallback(async () => {
    if (typeof provider.listConversations !== 'function') return;
    if (streamActiveRef.current) return;
    const list = await provider.listConversations();
    if (list.length === 0) return;
    const [mostRecent] = list;
    const currentId = activeIdRef.current;
    if (mostRecent.id === currentId) return;
    if (currentId && (byConvRef.current[currentId] || []).length === 0) return;

    const { meta, messages: history } = await provider.getConversation(mostRecent.id);
    setConversations((c) => (c.some((x) => x.id === meta.id) ? c : [
      { id: meta.id, title: meta.title, createdAt: Date.parse(meta.createdAt) || Date.now() },
      ...c,
    ]));
    // The store persists only { role, content } (conversationStore.js) —
    // give each restored message the id/createdAt the UI expects.
    const restored = history.map((m) => ({ ...m, id: makeId(), createdAt: Date.now() }));
    setByConv((prev) => ({ ...prev, [meta.id]: restored }));
    setActiveId(meta.id);
    setStream(emptyStream);
  }, [provider]);

  useEffect(() => {
    let cancelled = false;
    syncMostRecentConversation().catch(() => { /* no history yet, or unreachable — start fresh */ });
    const interval = setInterval(() => {
      if (!cancelled) syncMostRecentConversation().catch(() => {});
    }, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [syncMostRecentConversation]);

  const messages = activeId ? (byConv[activeId] || []) : [];

  const newConversation = useCallback((seed) => {
    const conv = { id: makeId(), title: titleFrom(seed || ''), createdAt: Date.now() };
    setConversations((c) => [conv, ...c]);
    setActiveId(conv.id);
    setStream(emptyStream);
    return conv.id;
  }, []);

  const openConversation = useCallback((id) => {
    setActiveId(id);
    setStream(emptyStream);
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations((c) => c.filter((x) => x.id !== id));
    setByConv((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const runStream = useCallback(async (convId, transcript, userText) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = makeId();
    setStream({ active: true, messageId: assistantId, content: '', reasoning: '', presence: PRESENCE_THINKING });

    let fullText = '';
    let fullReasoning = '';
    try {
      await provider.stream(transcript, {
        signal: controller.signal,
        conversationId: convId,
        onDelta: (chunk, isReasoning) => {
          if (isReasoning) {
            fullReasoning += chunk;
            setStream((s) => ({
              ...s,
              presence: PRESENCE_THINKING,
              reasoning: (s.reasoning || '') + chunk
            }));
          } else {
            fullText += chunk;
            setStream((s) => ({
              ...s,
              presence: PRESENCE_SPEAKING,
              content: s.content + chunk
            }));
          }
        },
      });

      if (controller.signal.aborted) {
        setStream(emptyStream);
        return null;
      }

      setByConv((prev) => {
        const current = prev[convId] || [];
        return {
          ...prev,
          [convId]: [
            ...current,
            { id: assistantId, role: 'assistant', content: fullText, reasoning: fullReasoning, createdAt: Date.now() },
          ],
        };
      });
      setStream(emptyStream);
      return fullText;
    } catch (e) {
      if (controller.signal.aborted) {
        setStream(emptyStream);
        return null;
      }
      const phrase = phraseReasoningError(e);
      setStream(emptyStream);
      setByConv((prev) => {
        const current = prev[convId] || [];
        return {
          ...prev,
          [convId]: [
            ...current,
            { id: makeId(), role: 'assistant', content: phrase, createdAt: Date.now(), error: true },
          ],
        };
      });
      return null;
    } finally {
      abortRef.current = null;
    }
  }, [provider]);

  const send = useCallback(async (text, attachments = []) => {
    const userText = (text || '').trim();
    if (!userText && attachments.length === 0) return;

    let convId = activeId;
    if (!convId) {
      convId = newConversation(userText || 'Attached files');
    } else {
      if (userText) {
        setConversations((c) => c.map((x) => (x.id === convId ? { ...x, title: titleFrom(userText) } : x)));
      }
    }

    const newMsg = { id: makeId(), role: 'user', content: userText, attachments, createdAt: Date.now() };

    setByConv((prev) => {
      const current = prev[convId] || [];
      return {
        ...prev,
        [convId]: [...current, newMsg],
      };
    });

    const currentConvMessages = byConv[convId] || [];
    const turnSoFar = [...currentConvMessages, newMsg];
    logLogosForDev(turnSoFar);
    const { transcript, userText: recalledFor } = await assembleTranscript(turnSoFar);

    await runStream(convId, transcript, recalledFor);
  }, [activeId, byConv, newConversation, runStream]);

  const editMessage = useCallback(async (messageId, newContent) => {
    if (!activeId) return;

    const current = byConv[activeId] || [];
    const index = current.findIndex((x) => x.id === messageId);
    if (index === -1) return;

    const truncated = current.slice(0, index + 1);
    truncated[index] = {
      ...truncated[index],
      content: newContent,
      createdAt: Date.now(),
    };

    setByConv((prev) => ({
      ...prev,
      [activeId]: truncated,
    }));

    const { transcript, userText } = await assembleTranscript(truncated);
    await runStream(activeId, transcript, userText);
  }, [activeId, byConv, runStream]);

  const deleteMessage = useCallback((messageId) => {
    if (!activeId) return;
    setByConv((prev) => {
      const current = prev[activeId] || [];
      return {
        ...prev,
        [activeId]: current.filter((x) => x.id !== messageId),
      };
    });
  }, [activeId]);

  const regenerate = useCallback(async (messageId) => {
    if (!activeId) return;

    const current = byConv[activeId] || [];
    const index = current.findIndex((x) => x.id === messageId);
    if (index === -1) return;

    const truncated = current.slice(0, index);
    setByConv((prev) => ({
      ...prev,
      [activeId]: truncated,
    }));

    const { transcript, userText } = await assembleTranscript(truncated);
    await runStream(activeId, transcript, userText);
  }, [activeId, byConv, runStream]);

  const retry = useCallback(async (messageId) => {
    if (!activeId) return;

    const current = byConv[activeId] || [];
    const index = current.findIndex((x) => x.id === messageId);
    if (index === -1) return;

    const truncated = current.slice(0, index);
    setByConv((prev) => ({
      ...prev,
      [activeId]: truncated,
    }));

    const { transcript, userText } = await assembleTranscript(truncated);
    await runStream(activeId, transcript, userText);
  }, [activeId, byConv, runStream]);

  return {
    conversations, activeId, messages, stream, health,
    newConversation, openConversation, deleteConversation,
    send, stop, editMessage, deleteMessage, regenerate, retry,
  };
}

function buildTranscript(messages) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

function latestUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') return messages[i].content || '';
  }
  return '';
}

/**
 * Assembles the transcript sent to Gaia Cloud: the raw conversation, no
 * system messages. Identity (SOUL, context-aware document selection) and
 * memory (recall before the call, reflection after) are gaia-api's job
 * now (docs/web-migration-plan.md Phase B/C) — this client sends only
 * what the user actually said.
 */
async function assembleTranscript(messages) {
  return {
    transcript: buildTranscript(messages),
    userText: latestUserText(messages),
  };
}
