package com.bluetasks.mobile.shared.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class TaskDateKeyTest {
    @Test
    fun validKeys() {
        assertTrue(isValidTaskDateKey("2025-03-22"))
        assertTrue(isValidTaskDateKey("2000-01-01"))
    }

    @Test
    fun invalidKeys() {
        assertFalse(isValidTaskDateKey(""))
        assertFalse(isValidTaskDateKey("2025-3-22"))
        assertFalse(isValidTaskDateKey("25-03-22"))
        assertFalse(isValidTaskDateKey("not-a-date"))
    }

    @Test
    fun dateKeyMillisRoundTrip() {
        val key = "2025-06-15"
        val ms = dateKeyToUtcStartMillis(key)
        assertEquals(key, utcMillisToDateKey(ms!!))
    }

    @Test
    fun dateKeyToMillisInvalid() {
        assertNull(dateKeyToUtcStartMillis(""))
        assertNull(dateKeyToUtcStartMillis("bad"))
    }

    @Test
    fun addDaysToDateKeyUtc() {
        assertEquals("2025-03-29", addDaysToDateKeyUtc("2025-03-22", 7))
        assertEquals("2025-03-21", addDaysToDateKeyUtc("2025-03-22", -1))
    }

    @Test
    fun addMonthsToDateKeyUtc() {
        assertEquals("2025-04-22", addMonthsToDateKeyUtc("2025-03-22", 1))
        assertEquals("2024-12-22", addMonthsToDateKeyUtc("2025-01-22", -1))
    }
}
