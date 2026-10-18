/**
 * Stopping a turn: the web client's cancel() must really end the request (so
 * Gaia Cloud sees the closed connection and saves the turn as interrupted),
 * keep the text that had already arrived, and never dress a deliberate stop
 * up as a failure.
 *
 * The hook takes its server as an argument, so these tests hand it a fake that
 * behaves like serverApi.streamTurn: deltas through the callback, a promise
 * that settles on abort or on its own.
 */
/* eslint-disable global-require */
if (typeof global.AbortController === 'undefined') {
  // jsdom without AbortController: the only things this code uses are signal,
  // signal.aborted, signal.addEventListener('abort') and abort().
  global.AbortController = class AbortController {
    constructor() {
      const listeners = [];
      this.signal = {
        aborted: false,
        addEventListener: (type, fn) => {
          if (type === 'abort') listeners.push(fn);
        },
        _listeners: listeners,
      };
    }

    abort() {
      if (this.signal.aborted) return;
      this.signal.aborted = true;
      this.signal._listeners.forEach((fn) => fn());
    }
  };
}

import { renderHook, act } from '@testing-library/react';
import { useConversation } from './useConversation';

jest.mock('../server/api', () => ({ speechApi: { synthesize: jest.fn().mockResolvedValue(new Uint8Array()) } }));
jest.mock('../lib/speech', () => ({ playSpeech: jest.fn() }));
jest.mock('../lib/language', () => ({ looksEnglish: () => false }));

const DELTAS = ['De ', 'vps staat ', 'weer om.'];

/** Streams three deltas, then settles: rejects on abort, otherwise resolves. */
function streamingServer() {
  const calls = [];
  const server = {
    calls,
    streamTurn: jest.fn(
      (body, onDelta, options = {}) =>
        new Promise((resolve, reject) => {
          calls.push({ body, options });
          DELTAS.forEach((text) => onDelta({ content: text, reasoningContent: '' }));
          if (!options.signal) {
            resolve(DELTAS.join(''));
            return;
          }
          options.signal.addEventListener('abort', () => {
            const error = new Error('the request was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    ),
  };
  return server;
}

function assistantMessages(result) {
  return result.current.active.messages.filter((m) => m.role === 'assistant');
}

describe('useConversation.cancel', () => {
  it('stops the running turn, aborts the request and keeps what already arrived', async () => {
    const server = streamingServer();
    const { result } = renderHook(() => useConversation(server));

    await act(async () => {
      result.current.send('hoe staat de vps?');
    });

    expect(result.current.busy).toBe(true);
    expect(result.current.streaming).toBe(true);
    expect(assistantMessages(result)[0].content).toBe(DELTAS.join(''));

    let stopped;
    await act(async () => {
      stopped = result.current.cancel();
    });

    expect(stopped).toBe(true);
    expect(server.calls[0].options.signal.aborted).toBe(true);
    expect(result.current.busy).toBe(false);
    expect(result.current.streaming).toBe(false);

    const replies = assistantMessages(result);
    expect(replies).toHaveLength(1);
    expect(replies[0].content).toBe(DELTAS.join(''));
    expect(replies[0].failed).toBeFalsy();
  });

  it('is nothing to stop when no turn is running', () => {
    const server = streamingServer();
    const { result } = renderHook(() => useConversation(server));

    let stopped;
    act(() => {
      stopped = result.current.cancel();
    });

    expect(stopped).toBe(false);
    expect(server.streamTurn).not.toHaveBeenCalled();
  });

  it('is idempotent: a second stop does nothing and still reports a stop the first time', async () => {
    const server = streamingServer();
    const { result } = renderHook(() => useConversation(server));

    await act(async () => {
      result.current.send('hoe staat de vps?');
    });

    let first;
    let second;
    await act(async () => {
      first = result.current.cancel();
      second = result.current.cancel();
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('lets a turn that finishes on its own keep its reply and reports no failure', async () => {
    const server = {
      streamTurn: jest.fn((body, onDelta) => {
        DELTAS.forEach((text) => onDelta({ content: text, reasoningContent: '' }));
        return Promise.resolve(DELTAS.join(''));
      }),
    };
    const { result } = renderHook(() => useConversation(server));

    await act(async () => {
      await result.current.send('hoe staat de vps?');
    });

    const replies = assistantMessages(result);
    expect(replies[0].content).toBe(DELTAS.join(''));
    expect(replies[0].failed).toBeFalsy();
    expect(result.current.busy).toBe(false);
  });

  it('still shows a real failure as a failure', async () => {
    const server = { streamTurn: jest.fn(() => Promise.reject(new Error('boom'))) };
    const { result } = renderHook(() => useConversation(server));

    await act(async () => {
      await result.current.send('hoe staat de vps?');
    });

    const replies = assistantMessages(result);
    expect(replies).toHaveLength(1);
    expect(replies[0].failed).toBe(true);
    expect(replies[0].content).toBeTruthy();
  });
});
