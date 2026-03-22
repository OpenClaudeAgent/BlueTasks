/** Upper bound aligned with server `taskSanitize` (`timeSpentSeconds` cap). */
export const MAX_TRACKED_SECONDS = 10_000_000;

export type HmsParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Split total seconds into non-negative h/m/s with minutes and seconds in 0–59.
 * Values are clamped to `MAX_TRACKED_SECONDS`.
 */
export function breakDownSeconds(totalSeconds: number): HmsParts {
  const clamped = clampTotalSeconds(totalSeconds);
  return {
    hours: Math.floor(clamped / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
    seconds: clamped % 60,
  };
}

export function clampTotalSeconds(value: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.min(n, MAX_TRACKED_SECONDS);
}

/**
 * Parse a single duration field from user input (digits only, non-negative).
 */
export function parseTimerField(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 0;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.floor(n);
}

/**
 * Build total seconds from h/m/s, carrying overflow (e.g. 90 minutes → 1h30).
 * Result is clamped to `MAX_TRACKED_SECONDS`.
 */
export function composeSeconds(hours: number, minutes: number, seconds: number): number {
  let h = Math.max(0, Math.floor(Number(hours)) || 0);
  let m = Math.max(0, Math.floor(Number(minutes)) || 0);
  let s = Math.max(0, Math.floor(Number(seconds)) || 0);

  m += Math.floor(s / 60);
  s %= 60;
  h += Math.floor(m / 60);
  m %= 60;

  const total = h * 3600 + m * 60 + s;
  return clampTotalSeconds(total);
}
