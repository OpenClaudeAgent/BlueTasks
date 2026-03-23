package com.bluetasks.mobile.shared.domain

import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertEquals

class TaskTimerTest {
    @Test
    fun noActiveTimer_returnsBase() {
        val now = Instant.parse("2025-01-15T12:00:00Z")
        assertEquals(42, totalDisplayedTimeSpentSeconds(42, null, now))
    }

    @Test
    fun activeTimer_addsElapsed() {
        val now = Instant.parse("2025-01-15T12:00:10Z")
        val started = "2025-01-15T12:00:00Z"
        assertEquals(100 + 10, totalDisplayedTimeSpentSeconds(100, started, now))
    }

    @Test
    fun formatDurationHms() {
        assertEquals("0:05", formatDurationHms(5))
        assertEquals("1:05", formatDurationHms(65))
        assertEquals("1:00:05", formatDurationHms(3605))
    }
}
