import {describe, expect, it} from 'vitest';
import {
  MAX_TRACKED_SECONDS,
  breakDownSeconds,
  clampTotalSeconds,
  composeSeconds,
  parseTimerField,
} from './taskTimerEdit';

describe('taskTimerEdit', () => {
  describe('clampTotalSeconds', () => {
    it('returns 0 for NaN and negatives', () => {
      expect(clampTotalSeconds(Number.NaN)).toBe(0);
      expect(clampTotalSeconds(-1)).toBe(0);
    });

    it('floors and caps at MAX_TRACKED_SECONDS', () => {
      expect(clampTotalSeconds(3.7)).toBe(3);
      expect(clampTotalSeconds(MAX_TRACKED_SECONDS + 1)).toBe(MAX_TRACKED_SECONDS);
    });
  });

  describe('breakDownSeconds', () => {
    it('returns zeros for 0', () => {
      expect(breakDownSeconds(0)).toEqual({hours: 0, minutes: 0, seconds: 0});
    });

    it('splits 3661 into 1h 1m 1s', () => {
      expect(breakDownSeconds(3661)).toEqual({hours: 1, minutes: 1, seconds: 1});
    });

    it('clamps overflow input', () => {
      expect(breakDownSeconds(MAX_TRACKED_SECONDS + 999).hours).toBe(
        Math.floor(MAX_TRACKED_SECONDS / 3600),
      );
    });
  });

  describe('composeSeconds', () => {
    it('composes 1h1m1s', () => {
      expect(composeSeconds(1, 1, 1)).toBe(3661);
    });

    it('carries seconds into minutes', () => {
      expect(composeSeconds(0, 0, 125)).toBe(125);
    });

    it('carries minutes into hours', () => {
      expect(composeSeconds(0, 90, 0)).toBe(5400);
    });

    it('clamps to MAX_TRACKED_SECONDS', () => {
      expect(composeSeconds(MAX_TRACKED_SECONDS, 0, 0)).toBe(MAX_TRACKED_SECONDS);
    });
  });

  describe('parseTimerField', () => {
    it('treats empty as 0', () => {
      expect(parseTimerField('')).toBe(0);
      expect(parseTimerField('   ')).toBe(0);
    });

    it('parses integer string', () => {
      expect(parseTimerField('12')).toBe(12);
    });

    it('returns 0 for invalid', () => {
      expect(parseTimerField('abc')).toBe(0);
      expect(parseTimerField('-3')).toBe(0);
    });
  });
});
