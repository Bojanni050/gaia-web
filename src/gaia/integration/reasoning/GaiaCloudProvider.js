import { ReasoningProvider } from './ReasoningProvider';
import { ReasoningUnavailableError, ReasoningAbortedError } from './errors';

/**
 * GaiaCloudProvider — talks to Gaia Cloud's uniform API
 * (`services/gaia-api`), never to Hermes directly.
 *
 * Replaces the earlier HermesProvider, which called Hermes directly
 * (docs/web-migration-plan.md's Phase C cutover) — identity, memory
 * recall/reflection, and context-aware document selection all now happen
 * server-side, inside gaia-api's performStreamingTurn (Phase B). This
 * provider sends the raw conversation only; it never assembles a system
 * prompt or calls Hindsight itself.
 *
 * Default URL is relative (/api/gaia), proxied same-origin — nginx in
 * production (nginx.conf.template, Phase A), craco's dev-server proxy
 * locally (craco.config.js). Either way, this provider never holds or
 * sends gaia-api's auth token — the proxy injects it server-side.
 * Deliberately no client-side token config: gaia-api sends no CORS
 * headers, so a browser attaching a custom Authorization header directly
 * is blocked at the CORS preflight regardless (confirmed the hard way
 * during this cutover's verification) — a same-origin proxy isn't an
 * optimization here, it's the only way this works from a real browser.
 * Override REACT_APP_GAIA_API_URL only for non-browser use (Node/tests).
 */
export class GaiaCloudProvider extends ReasoningProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = (config.baseUrl || process.env.REACT_APP_GAIA_API_URL || '/api/gaia')
      .replace(/\/+$/, '');
  }

  _headers() {
    return { 'Content-Type': 'application/json' };
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: this._headers(),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return { ok: false, detail: `health endpoint ${res.status}` };
      return { ok: true };
    } catch (_) {
      return { ok: false, detail: 'cannot reach Gaia Cloud' };
    }
  }

  async stream(messages, { signal, onDelta, conversationId } = {}) {
    let res;
    try {
      res = await fetch(`${this.baseUrl}/conversation/turn`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify({ messages, stream: true, conversationId }),
        signal,
      });
    } catch (_) {
      throw new ReasoningUnavailableError();
    }

    if (!res.ok || !res.body) {
      throw new ReasoningUnavailableError(`conversation/turn ${res.status}`);
    }

    return this._readSse(res.body, signal, onDelta);
  }

  async chat(messages, { signal, conversationId } = {}) {
    let res;
    try {
      res = await fetch(`${this.baseUrl}/conversation/turn`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify({ messages, conversationId }),
        signal,
      });
    } catch (_) {
      throw new ReasoningUnavailableError();
    }

    if (!res.ok) {
      throw new ReasoningUnavailableError(`conversation/turn ${res.status}`);
    }

    let data;
    try { data = await res.json(); } catch (_) {
      throw new ReasoningUnavailableError('invalid response body');
    }
    return data?.reply ?? '';
  }

  /**
   * Recent conversations, newest-first (gaia-api sorts by updatedAt) — used
   * to keep the sidebar in sync with what other clients have saved. See
   * services/gaia-api/src/historyRoutes.js.
   */
  async listConversations() {
    const res = await fetch(`${this.baseUrl}/conversations`, { headers: this._headers() });
    if (!res.ok) throw new ReasoningUnavailableError(`conversations ${res.status}`);
    const data = await res.json();
    return data?.conversations ?? [];
  }

  /**
   * Pushed notification (SSE, historyRoutes.js's GET /conversations/events)
   * that the conversation list changed — another client saved or deleted
   * one. Carries no payload on purpose; callers re-fetch listConversations()
   * themselves, so this can never drift from what a plain GET would return.
   * Returns an unsubscribe function. No-ops (returns a no-op unsubscribe)
   * when EventSource isn't available (e.g. under Node in tests).
   */
  subscribeToConversationChanges(onChange) {
    if (typeof EventSource === 'undefined') return () => {};
    const es = new EventSource(`${this.baseUrl}/conversations/events`);
    es.addEventListener('changed', () => onChange());
    return () => es.close();
  }

  async getConversation(id) {
    const res = await fetch(`${this.baseUrl}/conversations/${encodeURIComponent(id)}`, {
      headers: this._headers(),
    });
    if (!res.ok) throw new ReasoningUnavailableError(`conversations/${id} ${res.status}`);
    return res.json();
  }

  // --- SSE ---------------------------------------------------------------
  // Wire shape matches Hermes's own OpenAI-compatible frames — gaia-api
  // relays them unchanged (services/gaia-api/src/hermesClient.js's
  // stream(), services/gaia-api/src/turn.js's performStreamingTurn).

  async _readSse(body, signal, onDelta) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const onAbort = () => {
      try { reader.cancel(); } catch (_) { /* noop */ }
    };
    if (signal) {
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');

        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const delta = parseSseFrame(frame);
          if (delta) {
            const hasContent = typeof delta.content === 'string' && delta.content.length > 0;
            const hasReasoning = typeof delta.reasoning === 'string' && delta.reasoning.length > 0;
            if (hasContent) {
              fullText += delta.content;
              if (onDelta) onDelta(delta.content);
            }
            if (hasReasoning) {
              if (onDelta) onDelta(delta.reasoning, true);
            }
          }
        }
      }
    } catch (e) {
      if (signal?.aborted) throw new ReasoningAbortedError();
      throw new ReasoningUnavailableError();
    } finally {
      if (signal) signal.removeEventListener('abort', onAbort);
    }

    if (signal?.aborted) throw new ReasoningAbortedError();
    return fullText;
  }
}

function parseSseFrame(frame) {
  const lines = frame.split('\n');
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return null;
    try {
      const obj = JSON.parse(payload);
      const delta = obj?.choices?.[0]?.delta;
      if (delta) {
        return {
          content: delta.content || '',
          reasoning: delta.reasoning_content || '',
        };
      }
    } catch (_) { /* malformed frame, skip */ }
  }
  return null;
}
