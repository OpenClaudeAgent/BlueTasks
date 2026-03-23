package com.bluetasks.mobile.shared.domain

import kotlinx.datetime.Instant

/**
 * Total elapsed seconds for display: stored time plus active segment since [timerStartedAt], if any.
 * Matches the idea of web live timer + `timeSpentSeconds` (see `useBoardTimerNowMs`, timer stop delta).
 */
public fun totalDisplayedTimeSpentSeconds(
    timeSpentSeconds: Int,
    timerStartedAt: String?,
    now: Instant,
): Int {
    val base = timeSpentSeconds.coerceAtLeast(0)
    val startStr = timerStartedAt ?: return base
    val start =
        runCatching { Instant.parse(startStr) }.getOrNull() ?: return base
    val delta = (now - start).inWholeSeconds.toInt().coerceAtLeast(0)
    return base + delta
}

/** `H:MM:SS` for timers; omits hours if zero. */
public fun formatDurationHms(totalSeconds: Int): String {
    val s = totalSeconds.coerceAtLeast(0)
    val h = s / 3600
    val m = (s % 3600) / 60
    val sec = s % 60
    return if (h > 0) {
        "$h:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}"
    } else {
        "$m:${sec.toString().padStart(2, '0')}"
    }
}
