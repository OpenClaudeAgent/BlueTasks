/** @vitest-environment jsdom */
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {I18nextProvider} from 'react-i18next';
import i18n from '../../i18n';
import {TaskCardFooterTimerButton} from './TaskCardFooterTimerButton';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('TaskCardFooterTimerButton', () => {
  it('shows 0:00 on the edit trigger when no time tracked and timer stopped', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TaskCardFooterTimerButton
          onChange={vi.fn()}
          taskId="t1"
          timeSpentSeconds={0}
          timerStartedAt={null}
          trackedSeconds={0}
        />
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', {name: /edit tracked time/i})).toHaveTextContent('0:00');
  });

  it('opens popover and saves composed h/m/s, clearing a running timer', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TaskCardFooterTimerButton
          onChange={onChange}
          taskId="t1"
          timeSpentSeconds={10}
          timerStartedAt="2025-06-01T10:00:00.000Z"
          trackedSeconds={70}
        />
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', {name: /edit tracked time/i}));
    expect(screen.getByText(/saving stops the timer/i)).toBeInTheDocument();

    const hours = screen.getByRole('textbox', {name: /^hours$/i});
    const minutes = screen.getByRole('textbox', {name: /^minutes$/i});
    const seconds = screen.getByRole('textbox', {name: /^seconds$/i});

    await user.clear(hours);
    await user.type(hours, '0');
    await user.clear(minutes);
    await user.type(minutes, '5');
    await user.clear(seconds);
    await user.type(seconds, '0');

    await user.click(screen.getByRole('button', {name: /^save$/i}));

    expect(onChange).toHaveBeenCalledWith('t1', {
      timeSpentSeconds: 300,
      timerStartedAt: null,
    });
  });

  it('cancel closes popover without onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TaskCardFooterTimerButton
          onChange={onChange}
          taskId="t1"
          timeSpentSeconds={0}
          timerStartedAt={null}
          trackedSeconds={0}
        />
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', {name: /edit tracked time/i}));
    const minutes = screen.getByRole('textbox', {name: /^minutes$/i});
    await user.clear(minutes);
    await user.type(minutes, '99');

    await user.click(screen.getByRole('button', {name: /^cancel$/i}));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', {name: /^minutes$/i})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /edit tracked time/i}));
    expect(screen.getByRole('textbox', {name: /^minutes$/i})).toHaveValue('0');
  });
});
