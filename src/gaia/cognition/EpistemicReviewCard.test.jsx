import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';

import EpistemicReviewCard from './EpistemicReviewCard';
import { L } from '../lib/lexicon';

afterEach(cleanup);

const item = (overrides) => ({
  id: 'h1',
  statement: 'Bo werkt het best laat op de dag',
  status: 'confirmed',
  scope: 'macro',
  counter_hypothesis: 'Bo werkt juist het best vroeg',
  ...overrides,
});

const card = (props) => (
  <EpistemicReviewCard
    item={props.item}
    busy={false}
    onTest={jest.fn()}
    onReject={jest.fn()}
    onConfirm={jest.fn()}
    onReopen={jest.fn()}
  />
);

describe('the epistemic review card', () => {
  it('leaves a confirmed statement settled: the verdict stays, no answer is offered', () => {
    render(card({ item: item() }));

    expect(screen.getByText(L.cognitionStatusConfirmed)).toBeTruthy();
    expect(screen.getByText('Bo werkt het best laat op de dag')).toBeTruthy();
    expect(screen.queryByLabelText(L.cognitionConfirm)).toBeNull();
    expect(screen.queryByLabelText(L.cognitionReject)).toBeNull();
    expect(screen.queryByLabelText(L.cognitionTesting)).toBeNull();
    // The macro implication test is part of judging, not part of a settled card.
    expect(screen.queryByText(L.cognitionImplicationPrompt)).toBeNull();
  });

  it('still offers the verdict for a statement that is not settled', () => {
    render(card({ item: item({ status: 'proposed', scope: 'micro' }) }));

    expect(screen.getByLabelText(L.cognitionConfirm)).toBeTruthy();
    expect(screen.getByLabelText(L.cognitionReject)).toBeTruthy();
    expect(screen.queryByText(L.cognitionStatusConfirmed)).toBeNull();
  });
});

describe('friction for a statement that carries weight', () => {
  it('does not unlock Confirm for a micro statement with a counter-hypothesis until it is faced', () => {
    render(card({ item: item({ status: 'proposed', scope: 'micro' }) }));
    expect(screen.getByLabelText(L.cognitionConfirm).disabled).toBe(true);
    expect(screen.getByText(L.cognitionImplicationPrompt)).toBeTruthy();
  });

  it('lets a plain micro statement without a counter-hypothesis be confirmed at once', () => {
    render(card({ item: item({ status: 'proposed', scope: 'micro', counter_hypothesis: null }) }));
    expect(screen.getByLabelText(L.cognitionConfirm).disabled).toBe(false);
    expect(screen.queryByText(L.cognitionImplicationPrompt)).toBeNull();
  });
});
