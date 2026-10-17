import React from 'react';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

// CRA's jest does not transform these ESM-only packages, and this test is about
// the person's own route back — not about how a reply is typeset.
jest.mock('./Markdown', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }) => React.createElement('span', null, children) };
});

import MessageView from './MessageView';
import { L } from '../lib/lexicon';

afterEach(cleanup);

const reply = (extra = {}) => ({
  id: 'a1',
  role: 'assistant',
  content: 'Yassine is een vriend van je.',
  ...extra,
});

const asked = { id: 'u1', role: 'user', content: 'wie is Yassine?' };

// jsdom has no selection, so the person's highlight is the test's own: one
// stand-in for the DOM Selection API, driven per test.
const realSelection = window.getSelection;

const selectionAt = (text, node) => {
  window.getSelection = () => ({ anchorNode: node, toString: () => text });
};

afterEach(() => {
  window.getSelection = realSelection;
});

describe('MessageView: taking a memory back', () => {
  it('offers the way back on her reply only, and only when the route is wired', () => {
    const { rerender } = render(<MessageView message={reply()} onRetract={() => {}} />);
    expect(screen.getByTestId('message-retract-btn')).toBeTruthy();

    rerender(<MessageView message={asked} onRetract={() => {}} />);
    expect(screen.queryByTestId('message-retract-btn')).toBeNull();

    rerender(<MessageView message={reply()} />);
    expect(screen.queryByTestId('message-retract-btn')).toBeNull();
  });

  it('takes the marked sentence as the quote, and says what the server answered', async () => {
    const calls = [];
    const onRetract = async (quote, correction) => {
      calls.push([quote, correction]);
      return { status: 'retracted', message: 'Taken back: "Yassine is een vriend van je"' };
    };
    const { container } = render(<MessageView message={reply()} onRetract={onRetract} />);

    // What is really there: a highlight around the sentence in her reply.
    selectionAt('   Yassine is een vriend   van je  ', container.querySelector('.msg-body'));
    fireEvent.click(screen.getByTestId('message-retract-btn'));

    const quoteField = screen.getByTestId('retract-quote-input');
    expect(quoteField.value).toBe('Yassine is een vriend van je');

    fireEvent.change(screen.getByTestId('retract-correction-input'), {
      target: { value: '  Yassine is een kennis  ' },
    });
    fireEvent.click(screen.getByTestId('retract-send'));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual(['Yassine is een vriend van je', 'Yassine is een kennis']);
    expect(screen.getByTestId('retract-answer').textContent).toContain('Taken back: "Yassine is een vriend van je"');
  });

  it('will not let a highlight from somewhere else on the page become the quote', () => {
    const { container } = render(<MessageView message={reply()} onRetract={() => {}} />);

    selectionAt('iets uit een andere hoek van de pagina', document.body);
    fireEvent.click(screen.getByTestId('message-retract-btn'));

    expect(container.querySelector('[data-testid="retract-quote-input"]').value).toBe('');
    expect(screen.getByTestId('retract-send').disabled).toBe(true);
  });

  it('asks which one when more than one memory fits, and re-sends the chosen one', async () => {
    const calls = [];
    const onRetract = async (quote) => {
      calls.push(quote);
      if (calls.length > 1) return { status: 'retracted', message: 'Taken back: "de tweede"' };
      return {
        status: 'ambiguous',
        message: 'More than one memory matches',
        candidates: [
          { bank: 'bojan', id: 'f1', text: 'Yassine is een vriend van je' },
          { bank: 'gaia-logos', id: 'f2', text: 'de tweede' },
        ],
      };
    };
    render(<MessageView message={reply()} onRetract={onRetract} />);

    fireEvent.click(screen.getByTestId('message-retract-btn'));
    fireEvent.change(screen.getByTestId('retract-quote-input'), { target: { value: 'Yassine' } });
    fireEvent.click(screen.getByTestId('retract-send'));

    await waitFor(() => expect(screen.getByTestId('retract-answer').textContent).toContain(L.retractPick));
    const candidates = screen.getAllByTestId('retract-candidate');
    expect(candidates.length).toBe(2);

    fireEvent.click(candidates[1]);
    await waitFor(() => expect(calls).toEqual(['Yassine', 'de tweede']));
  });

  it('says so in her own words when taking it back fails', async () => {
    const onRetract = async () => { throw new Error('HTTP 500'); };
    render(<MessageView message={reply()} onRetract={onRetract} />);

    fireEvent.click(screen.getByTestId('message-retract-btn'));
    fireEvent.change(screen.getByTestId('retract-quote-input'), { target: { value: 'Yassine' } });
    fireEvent.click(screen.getByTestId('retract-send'));

    await waitFor(() => expect(screen.getByTestId('retract-answer').textContent).toContain(L.retractFailed));
  });
});
