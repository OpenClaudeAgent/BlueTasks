import {describe, expect, it} from 'vitest';
import {createTask} from './tasks';
import {formatDurationLabel, formatEstimateMinutesLabel, formatTrackedSeconds, nextPriority} from './taskCardFormat';

const t = (key: string, opts?: {count: number}) => {
  switch (key) {
    case 'estimateDays':
      return `${opts?.count} d`;
    case 'estimateHours':
      return `${opts?.count} h`;
    case 'estimateMinutesShort':
      return `${opts?.count} min`;
    default:
      return key;
  }
};

describe('Feature: Task card time display', () => {
  describe('Scenario: Timer is not running', () => {
    it('given only timeSpentSeconds, when formatTrackedSeconds runs, then it returns the stored base', () => {
      const task = createTask('T');
      task.timeSpentSeconds = 42;
      task.timerStartedAt = null;
      expect(formatTrackedSeconds(task, 1_000_000)).toBe(42);
    });
  });

  describe('Scenario: Timer is running', () => {
    it('given timerStartedAt and now ahead by 5s, when formatTrackedSeconds runs, then base increases by 5', () => {
      const task = createTask('T');
      task.timeSpentSeconds = 10;
      task.timerStartedAt = new Date('2025-01-01T12:00:00.000Z').toISOString();
      const now = Date.parse('2025-01-01T12:00:05.000Z');
      expect(formatTrackedSeconds(task, now)).toBe(15);
    });

    it('given invalid timerStartedAt, when formatTrackedSeconds runs, then it falls back to base only', () => {
      const task = createTask('T');
      task.timeSpentSeconds = 7;
      task.timerStartedAt = 'not-a-date';
      expect(formatTrackedSeconds(task, 99_999)).toBe(7);
    });
  });

  describe('Scenario: Duration label for footer chip', () => {
    it('given under one hour, when formatDurationLabel runs, then it uses m:ss', () => {
      expect(formatDurationLabel(125)).toBe('2:05');
    });

    it('given one hour or more, when formatDurationLabel runs, then it uses h:mm:ss', () => {
      expect(formatDurationLabel(3665)).toBe('1:01:05');
    });

    it('given negative input, when formatDurationLabel runs, then it clamps to zero', () => {
      expect(formatDurationLabel(-10)).toBe('0:00');
    });
  });
});

describe('Feature: Estimate label on task card', () => {
  describe('Scenario: Whole days', () => {
    it('given 2880 minutes (2 days), when labeled, then it uses estimateDays', () => {
      expect(formatEstimateMinutesLabel(2880, t)).toBe('2 d');
    });
  });

  describe('Scenario: Whole hours', () => {
    it('given 120 minutes, when labeled, then it uses estimateHours', () => {
      expect(formatEstimateMinutesLabel(120, t)).toBe('2 h');
    });
  });

  describe('Scenario: Arbitrary minutes', () => {
    it('given 45 minutes, when labeled, then it uses estimateMinutesShort', () => {
      expect(formatEstimateMinutesLabel(45, t)).toBe('45 min');
    });
  });
});

describe('Feature: Priority cycling', () => {
  describe('Scenario: User cycles priority control', () => {
    it('given normal, when nextPriority is applied, then it becomes high', () => {
      expect(nextPriority('normal')).toBe('high');
    });

    it('given high, when nextPriority is applied, then it wraps to low', () => {
      expect(nextPriority('high')).toBe('low');
    });

    it('given low, when nextPriority is applied, then it becomes normal', () => {
      expect(nextPriority('low')).toBe('normal');
    });
  });
});
