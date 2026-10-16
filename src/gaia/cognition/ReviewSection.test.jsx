import React from 'react';
import { fireEvent, render, cleanup, screen, waitFor } from '@testing-library/react';

// The section reaches Gaia Cloud only through this module; nothing here may
// touch a real server.
jest.mock('../server/api', () => ({
  cognitionApi: { list: jest.fn(), reopen: jest.fn() },
}));

import { cognitionApi } from '../server/api';
import { L } from '../lib/lexicon';
import ReviewSection from './ReviewSection';

afterEach(cleanup);

const item = (overrides) => ({
  id: 'h1',
  statement: 's-h1',
  status: 'proposed',
  scope: 'micro',
  ...overrides,
});

const mixed = () => [
  item(),
  item({ id: 'c1', statement: 's-c1', status: 'confirmed' }),
  item({ id: 'r1', statement: 's-r1', status: 'rejected' }),
];

// The section loads on first expand, and the tabs only exist once the list has
// arrived — so waiting for the three tabs is waiting for the section.
const open = async (items) => {
  cognitionApi.list.mockResolvedValue(items);
  render(<ReviewSection />);
  fireEvent.click(screen.getByRole('button', { name: L.cognition }));
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(3));
};

// The count badge rides inside the tab, so its accessible name carries the
// number too — match on the label, not on the whole name.
const tab = (name) => screen.getByRole('tab', { name: new RegExp(name) });

describe('the cognition review section', () => {
  it('keeps what is settled and what was let go out of the cards to review', async () => {
    await open(mixed());

    expect(screen.getByText('s-h1')).toBeTruthy();
    expect(screen.queryByText('s-c1')).toBeNull();
    expect(screen.queryByText('s-r1')).toBeNull();
  });

  it('gives what is settled its own tab next to what was let go', async () => {
    await open(mixed());

    fireEvent.click(tab(L.cognitionTabConfirmed));

    expect(screen.getByText('s-c1')).toBeTruthy();
    expect(screen.queryByText('s-h1')).toBeNull();
    expect(screen.queryByText('s-r1')).toBeNull();

    fireEvent.click(tab(L.cognitionTabReopen));

    expect(screen.getByText('s-r1')).toBeTruthy();
    expect(screen.queryByText('s-c1')).toBeNull();
  });

  it('counts what waits on every tab, including the closed ones', async () => {
    await open(mixed());

    const counts = [...document.querySelectorAll('.cognition-tab-count')];
    expect(counts.map((n) => n.textContent)).toEqual(['1', '1', '1']);
    expect(tab(L.cognitionTabConfirmed).getAttribute('aria-selected')).toBe('false');
  });

  it('says each list is empty in its own words', async () => {
    await open([item({ id: 'r1', statement: 's-r1', status: 'rejected' })]);

    expect(screen.getByText(L.cognitionEmpty)).toBeTruthy();

    fireEvent.click(tab(L.cognitionTabConfirmed));
    expect(screen.getByText(L.cognitionConfirmedEmpty)).toBeTruthy();

    fireEvent.click(tab(L.cognitionTabReopen));
    expect(screen.getByText('s-r1')).toBeTruthy();
  });

  it('moves a reopened statement back to the cards to review, without a refetch', async () => {
    cognitionApi.reopen.mockResolvedValue({ id: 'r1', status: 'testing' });
    await open([item({ id: 'r1', statement: 's-r1', status: 'rejected' })]);

    fireEvent.click(tab(L.cognitionTabReopen));
    fireEvent.change(screen.getByPlaceholderText(L.cognitionReopenPlaceholder), {
      target: { value: 'omdat het toch klopt' },
    });
    fireEvent.click(screen.getByLabelText(L.cognitionReopen));

    await waitFor(() => expect(screen.queryByText('s-r1')).toBeNull());
    fireEvent.click(tab(L.cognitionTabReview));
    expect(screen.getByText('s-r1')).toBeTruthy();
    expect(cognitionApi.list).toHaveBeenCalledTimes(1);
  });
});

describe('the review round, as the section shows it', () => {
  it('keeps statements outside the round off the cards and says how many wait', async () => {
    await open([
      item({ id: 'a', statement: 's-a', in_round: true }),
      item({ id: 'b', statement: 's-b', in_round: false }),
      item({ id: 'c', statement: 's-c', in_round: false }),
      item({ id: 'k', statement: 's-k', status: 'confirmed' }),
      item({ id: 'r', statement: 's-r', status: 'rejected' }),
    ]);

    expect(screen.getByText('s-a')).toBeTruthy();
    expect(screen.queryByText('s-b')).toBeNull();
    expect(screen.queryByText('s-c')).toBeNull();
    expect(screen.getByText(L.cognitionWaiting.replace('{n}', '2'))).toBeTruthy();
    // Waiting statements are not counted as cards to review.
    const counts = [...document.querySelectorAll('.cognition-tab-count')];
    expect(counts.map((n) => n.textContent)).toEqual(['1', '1', '1']);
  });

  it('shows no waiting note when the whole list is in the round', async () => {
    await open([item({ id: 'a', statement: 's-a', in_round: true })]);
    expect(screen.queryByText(L.cognitionWaiting.replace('{n}', '0'))).toBeNull();
    expect(document.body.textContent).not.toContain(L.cognitionWaiting.split('{n}')[0]);
  });
});
