/** @vitest-environment jsdom */
import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LanguageSwitcher} from './LanguageSwitcher';

describe('Feature: Language switcher', () => {
  describe('Scenario: User picks UI language', () => {
    it('given French active, when user clicks EN, then onChange is called with en', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <LanguageSwitcher label="Language" language="fr" onChange={onChange} />,
      );

      const group = screen.getByRole('group', {name: 'Language'});
      await user.click(within(group).getByRole('button', {name: 'EN'}));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('en');
    });

    it('given English active, when rendered, then EN button has active class', () => {
      render(
        <LanguageSwitcher label="Langue" language="en" onChange={vi.fn()} />,
      );
      const en = screen.getByRole('button', {name: 'EN'});
      expect(en).toHaveClass('is-active');
      expect(screen.getByRole('button', {name: 'FR'})).not.toHaveClass('is-active');
    });
  });
});
