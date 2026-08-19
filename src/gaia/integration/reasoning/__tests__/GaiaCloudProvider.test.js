/**
 * Tests for GaiaCloudProvider.
 *
 * We mock global fetch to drive the provider through realistic SSE shapes
 * without depending on a running server. Wire shape for stream() matches
 * HermesProvider's old fixtures exactly (gaia-api relays the same
 * OpenAI-compatible frames unchanged); chat() differs, since gaia-api's
 * own response shape is { reply }, not OpenAI's { choices }.
 *
 * @jest-environment node
 */
import { ReadableStream } from 'node:stream/web';
import { GaiaCloudProvider } from '../GaiaCloudProvider';
import {
  ReasoningUnavailableError,
  ReasoningAbortedError,
} from '../errors';

function makeSseResponse(chunks) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return { ok: true, status: 200, body };
}

function makeErrorResponse(status) {
  return { ok: false, status, body: null };
}

function jsonResponse(obj) {
  return {
    ok: true,
    status: 200,
    json: async () => obj,
  };
}

describe('GaiaCloudProvider', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('configuration', () => {
    test('uses sensible defaults when no config is provided', () => {
      const p = new GaiaCloudProvider();
      expect(p.baseUrl).toBe('/api/gaia');
    });

    test('honors explicit configuration', () => {
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891/' });
      expect(p.baseUrl).toBe('http://g:8891');
    });

    test('never sends an Authorization header — the browser never holds gaia-api\'s token', async () => {
      let captured;
      global.fetch = jest.fn(async (url, init) => {
        captured = { url, init };
        return makeErrorResponse(500);
      });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      try { await p.stream([{ role: 'user', content: 'hi' }]); } catch (_) { /* expected */ }
      expect(captured.init.headers.Authorization).toBeUndefined();
    });
  });

  describe('health()', () => {
    test('returns ok when /health answers 200', async () => {
      global.fetch = jest.fn(async () => ({ ok: true, status: 200 }));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const result = await p.health();
      expect(result).toEqual({ ok: true });
    });

    test('returns not-ok when /health returns a non-2xx', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, status: 503 }));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const result = await p.health();
      expect(result.ok).toBe(false);
    });

    test('returns not-ok when fetch throws (Gaia Cloud unreachable)', async () => {
      global.fetch = jest.fn(async () => { throw new Error('ECONNREFUSED'); });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const result = await p.health();
      expect(result.ok).toBe(false);
    });
  });

  describe('stream()', () => {
    test('posts the raw messages with stream:true and assembles text from SSE deltas', async () => {
      const sse = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":", world"}}]}\n\n',
        'data: [DONE]\n\n',
      ].join('');
      let captured;
      global.fetch = jest.fn(async (url, init) => {
        captured = { url, init };
        return makeSseResponse([sse]);
      });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });

      const onDelta = jest.fn();
      const full = await p.stream([{ role: 'user', content: 'hi' }], { onDelta });

      expect(full).toBe('Hello, world');
      expect(captured.url).toBe('http://g:8891/conversation/turn');
      expect(JSON.parse(captured.init.body)).toEqual({ messages: [{ role: 'user', content: 'hi' }], stream: true });
      expect(onDelta).toHaveBeenCalledTimes(2);
      expect(onDelta).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onDelta).toHaveBeenNthCalledWith(2, ', world');
    });

    test('assembles reasoning content from SSE deltas and passes to onDelta with isReasoning = true', async () => {
      const sse = [
        'data: {"choices":[{"delta":{"reasoning_content":"Thinking"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Result is 4"}}]}\n\n',
        'data: [DONE]\n\n',
      ].join('');
      global.fetch = jest.fn(async () => makeSseResponse([sse]));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });

      const onDelta = jest.fn();
      const full = await p.stream([{ role: 'user', content: 'hi' }], { onDelta });

      expect(full).toBe('Result is 4');
      expect(onDelta).toHaveBeenNthCalledWith(1, 'Thinking', true);
      expect(onDelta).toHaveBeenNthCalledWith(2, 'Result is 4');
    });

    test('ignores malformed SSE frames without throwing', async () => {
      const sse = [
        'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
        'data: not-json\n\n',
        'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
        'data: [DONE]\n\n',
      ].join('');
      global.fetch = jest.fn(async () => makeSseResponse([sse]));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });

      const full = await p.stream([{ role: 'user', content: 'hi' }]);
      expect(full).toBe('AB');
    });

    test('throws ReasoningUnavailableError when fetch rejects', async () => {
      global.fetch = jest.fn(async () => { throw new Error('network down'); });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      await expect(p.stream([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(ReasoningUnavailableError);
    });

    test('throws ReasoningUnavailableError when server returns non-2xx', async () => {
      global.fetch = jest.fn(async () => makeErrorResponse(500));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      await expect(p.stream([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(ReasoningUnavailableError);
    });

    test('throws ReasoningAbortedError when the signal aborts mid-stream', async () => {
      const encoder = new TextEncoder();
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"A"}}]}\n\n'));
        },
        pull() {
          return new Promise(() => {});
        },
      });
      global.fetch = jest.fn(async () => ({ ok: true, status: 200, body }));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 30);

      await expect(p.stream([{ role: 'user', content: 'hi' }], { signal: controller.signal })).rejects.toBeInstanceOf(ReasoningAbortedError);
    });
  });

  describe('chat()', () => {
    test('posts the raw messages without stream, and reads gaia-api\'s { reply } shape directly', async () => {
      let captured;
      global.fetch = jest.fn(async (url, init) => {
        captured = { url, init };
        return jsonResponse({ reply: 'hi back' });
      });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const text = await p.chat([{ role: 'user', content: 'hi' }]);

      expect(text).toBe('hi back');
      expect(JSON.parse(captured.init.body)).toEqual({ messages: [{ role: 'user', content: 'hi' }] });
    });

    test('returns empty string when the response has no reply field', async () => {
      global.fetch = jest.fn(async () => jsonResponse({}));
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      const text = await p.chat([{ role: 'user', content: 'hi' }]);
      expect(text).toBe('');
    });

    test('throws ReasoningUnavailableError on network failure', async () => {
      global.fetch = jest.fn(async () => { throw new Error('down'); });
      const p = new GaiaCloudProvider({ baseUrl: 'http://g:8891' });
      await expect(p.chat([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(ReasoningUnavailableError);
    });
  });
});
