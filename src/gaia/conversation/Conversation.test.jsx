import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

// CRA's jest does not transform these ESM-only packages, and this test is
// about where the view sits — not about how a reply is typeset or animated.
jest.mock('./Markdown', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }) => React.createElement('span', null, children) };
});
jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children }) => React.createElement(tag, null, children);
  return { motion: { div: passthrough('div'), h1: passthrough('h1'), span: passthrough('span') } };
});

import Conversation from './Conversation';

afterEach(cleanup);

// jsdom lays nothing out, so the scrolling container's metrics are the test's
// own: one shared stand-in for the browser's layout, driven per test.
const view = { content: 0, viewport: 600, top: 0 };
let jumps = [];

beforeEach(() => {
  view.content = 1200;
  view.viewport = 600;
  view.top = view.content - view.viewport;
  jumps = [];
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => view.content });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => view.viewport });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get: () => view.top,
    // The browser clamps a jump to the scrollable range; so does this.
    set: (value) => { view.top = Math.max(0, Math.min(value, view.content - view.viewport)); },
  });
  HTMLElement.prototype.scrollTo = function (options) {
    jumps.push(typeof options === 'number' ? { top: options } : options);
    this.scrollTop = typeof options === 'number' ? options : options.top;
  };
});

const bottom = () => view.content - view.viewport;

const asked = { id: 'u1', role: 'user', content: 'waarom is de vps onbereikbaar?' };
const reply = (content) => ({ id: 'a1', role: 'assistant', content });

const props = (overrides = {}) => ({
  stream: { active: false, content: null, presence: 'quiet', messageId: null },
  health: { status: 'ok' },
  conversationId: 'c1',
  onSend: () => {},
  onStop: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onRegenerate: () => {},
  onRetry: () => {},
  ...overrides,
});

/** Renders one conversation and hands back its scrolling container. */
const show = (messages, overrides = {}) => {
  const utils = render(<Conversation messages={messages} {...props(overrides)} />);
  return { ...utils, el: utils.container.querySelector('.conversation-scroll') };
};

/** The reply grew: more text is laid out, the person touched nothing. */
const replyGrows = (px) => { view.content += px; };

/** The person drags the view up and the browser reports it. */
const personScrollsUp = (px, el) => { view.top -= px; fireEvent.scroll(el); };

describe('following a reply while it streams', () => {
  it('stays at the tail when the reply grows faster than the browser reports our own jump', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    expect(el.scrollTop).toBe(bottom());

    // The reply grows and only THEN is the scroll event of our own jump
    // delivered — the growth reads as distance-from-bottom although nobody
    // scrolled. This is what used to stop the view mid-answer.
    replyGrows(300);
    fireEvent.scroll(el);

    rerender(<Conversation messages={[asked, reply('Eerste deel. En nog een stuk dat eraan groeit.')]} {...props()} />);
    expect(el.scrollTop).toBe(bottom());
  });

  it('keeps following after a small growth the person could not even see', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    replyGrows(50);
    fireEvent.scroll(el);
    rerender(<Conversation messages={[asked, reply('Eerste deel. Nog eentje.')]} {...props()} />);
    expect(el.scrollTop).toBe(bottom());
  });

  it('never animates a jump: the reply is written faster than an animation could follow', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    rerender(<Conversation messages={[asked, reply('Eerste deel, en nog een regel.')]} {...props()} />);
    expect(jumps.length).toBeGreaterThan(0);
    expect(jumps.every((jump) => jump.behavior === 'auto')).toBe(true);
  });

  it('leaves the view alone once the person scrolls up themselves', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    personScrollsUp(400, el);
    const whereThePersonIs = el.scrollTop;

    replyGrows(200);
    rerender(<Conversation messages={[asked, reply('Eerste deel. En de rest van het antwoord.')]} {...props()} />);
    expect(el.scrollTop).toBe(whereThePersonIs);
  });

  it('follows again when the person scrolls back to the tail', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    personScrollsUp(400, el);
    el.scrollTop = el.scrollHeight - el.clientHeight;
    fireEvent.scroll(el);

    replyGrows(200);
    rerender(<Conversation messages={[asked, reply('Eerste deel. En de rest van het antwoord.')]} {...props()} />);
    expect(el.scrollTop).toBe(bottom());
  });

  it('brings the tail back into view when the person sends a new message', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    personScrollsUp(400, el);

    rerender(<Conversation messages={[asked, reply('Eerste deel.'), { id: 'u2', role: 'user', content: 'en nog iets' }]} {...props()} />);
    expect(el.scrollTop).toBe(bottom());
  });

  it('opens another conversation at its newest turn', () => {
    const { el, rerender } = show([asked, reply('Eerste deel.')]);
    view.content = 4000;
    personScrollsUp(200, el);

    rerender(<Conversation messages={[asked, reply('Een ander gesprek.')]} {...props({ conversationId: 'c2' })} />);
    expect(el.scrollTop).toBe(bottom());
  });
});
