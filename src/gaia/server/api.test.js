/**
 * The web client's streamTurn, tested against the frame family Gaia Cloud
 * actually writes (services/gaia-api/src/responseEngine.js): OpenAI-compatible
 * content frames, extension frames that carry a `type`, an `error` frame and a
 * closing `data: [DONE]`.
 *
 * jsdom has no TextDecoder in some versions and no ReadableStream at all, so
 * the reader below is a stand-in for the part of a Response this module uses:
 * ok, headers.get, body.getReader().read().
 */
/* eslint-disable global-require */
const { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder } = require('util');
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = NodeTextDecoder;
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = NodeTextEncoder;

import { serverApi } from './api';

const encoder = new TextEncoder();

function streamedResponse(frames) {
  const chunks = frames.map((frame) => encoder.encode(frame));
  let index = 0;
  return {
    ok: true,
    headers: { get: () => 'text/event-stream' },
    body: {
      getReader: () => ({
        read: async () => (index < chunks.length ? { value: chunks[index++], done: false } : { value: undefined, done: true }),
      }),
    },
  };
}

const contentFrame = (text) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('serverApi.streamTurn', () => {
  it('hands every content delta on as it arrives and returns the whole reply', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      streamedResponse([contentFrame('De '), contentFrame('vps '), contentFrame('is weer online.'), 'data: [DONE]\n\n'])
    );

    const seen = [];
    const full = await serverApi.streamTurn({ messages: [], stream: true }, (delta) => seen.push(delta.content));

    expect(seen).toEqual(['De ', 'vps ', 'is weer online.']);
    expect(full).toBe('De vps is weer online.');
  });

  it('splits on the blank line, so a frame arriving in pieces is still one delta', async () => {
    const frame = contentFrame('Helemaal goed.');
    const half = Math.floor(frame.length / 2);
    const bytes = encoder.encode(frame);
    let index = 0;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/event-stream' },
      body: {
        getReader: () => ({
          read: async () => {
            if (index === 0) {
              index += 1;
              return { value: bytes.slice(0, half), done: false };
            }
            if (index === 1) {
              index += 1;
              return { value: bytes.slice(half), done: false };
            }
            return { value: undefined, done: true };
          },
        }),
      },
    });

    const seen = [];
    const full = await serverApi.streamTurn({ messages: [], stream: true }, (delta) => seen.push(delta.content));

    expect(seen).toEqual(['Helemaal goed.']);
    expect(full).toBe('Helemaal goed.');
  });

  it('keeps progress frames out of the reply and hands them to onEvent', async () => {
    const step = { choices: [{ delta: {} }], type: 'step', step: { id: 's1', index: 1, total: 2, status: 'start' } };
    global.fetch = jest.fn().mockResolvedValue(
      streamedResponse([
        `data: ${JSON.stringify(step)}\n\n`,
        contentFrame('Klaar.'),
        `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'even denken' } }] })}\n\n`,
        'data: [DONE]\n\n',
      ])
    );

    const deltas = [];
    const events = [];
    const full = await serverApi.streamTurn(
      { messages: [], stream: true },
      (delta) => deltas.push(delta),
      { onEvent: (frame) => events.push(frame.type) }
    );

    expect(full).toBe('Klaar.');
    expect(deltas).toEqual([{ content: 'Klaar.', reasoningContent: '' }, { content: '', reasoningContent: 'even denken' }]);
    expect(events).toEqual(['step']);
  });

  it('throws on an error frame — the stream has no [DONE] when it failed', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      streamedResponse([`data: ${JSON.stringify({ choices: [{ delta: {} }], type: 'error', message: 'the model refused' })}\n\n`])
    );

    await expect(serverApi.streamTurn({ messages: [], stream: true }, () => {})).rejects.toThrow('the model refused');
  });

  it('reads a plain JSON reply as one piece when the answer is not a stream', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ reply: 'Alleen JSON.' }),
    });

    const seen = [];
    const full = await serverApi.streamTurn({ messages: [] }, (delta) => seen.push(delta.content));

    expect(seen).toEqual(['Alleen JSON.']);
    expect(full).toBe('Alleen JSON.');
  });

  it('passes the stop signal to fetch, so aborting really closes the connection', async () => {
    const signal = { aborted: false };
    const fetchMock = jest.fn().mockResolvedValue(streamedResponse([contentFrame('hoi'), 'data: [DONE]\n\n']));
    global.fetch = fetchMock;

    await serverApi.streamTurn({ messages: [], stream: true }, () => {}, { signal });

    expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
    expect(fetchMock.mock.calls[0][1].headers.Accept).toBe('text/event-stream');
  });
});
