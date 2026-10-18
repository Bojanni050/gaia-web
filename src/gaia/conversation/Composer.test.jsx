/**
 * One button, two meanings: while nothing runs it is the accent arrow that
 * sends; while she is thinking or answering it is a stop button in the same
 * place. Stopping is the person's choice, so it must never look like sending.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Composer from './Composer';

function typeInto(text) {
  const box = screen.getByRole('textbox');
  fireEvent.change(box, { target: { value: text } });
  return box;
}

describe('Composer: the arrow becomes her stop button', () => {
  it('shows the send arrow while nothing is running', () => {
    render(<Composer onSend={jest.fn()} onStop={jest.fn()} streaming={false} />);

    expect(screen.getByTestId('send-btn')).toBeTruthy();
    expect(screen.queryByTestId('stop-btn')).toBeNull();
  });

  it('shows a stop button while she is thinking or answering, and it stops', () => {
    const onStop = jest.fn();
    render(<Composer onSend={jest.fn()} onStop={onStop} streaming />);

    const stop = screen.getByTestId('stop-btn');
    expect(stop.getAttribute('aria-label')).toMatch(/stop|stoppen/i);
    expect(stop.className).toContain('stop');
    fireEvent.click(stop);

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('sends nothing while a turn is running, not even on Enter', () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} onStop={jest.fn()} streaming />);

    const box = typeInto('nog iets');
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends the typed text on the arrow when nothing is running', () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} onStop={jest.fn()} streaming={false} />);

    typeInto('hoe staat de vps?');
    fireEvent.click(screen.getByTestId('send-btn'));

    expect(onSend).toHaveBeenCalledWith('hoe staat de vps?', expect.anything());
  });
});
