package com.bluetasks.mobile.shared.domain

import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import kotlinx.datetime.plus
import kotlinx.datetime.toLocalDateTime

private val dateKeyRegex = Regex("^\\d{4}-\\d{2}-\\d{2}$")

/** Returns true if [s] is a valid calendar key `YYYY-MM-DD`. */
public fun isValidTaskDateKey(s: String): Boolean = dateKeyRegex.matches(s)

private fun formatUtcDateKey(date: LocalDate): String {
    val m = date.monthNumber.toString().padStart(2, '0')
    val day = date.dayOfMonth.toString().padStart(2, '0')
    return "${date.year}-$m-$day"
}

/** Epoch milliseconds at the start of that calendar day in UTC, or null if [key] is invalid. */
public fun dateKeyToUtcStartMillis(key: String): Long? {
    if (!isValidTaskDateKey(key)) return null
    return LocalDate.parse(key).atStartOfDayIn(TimeZone.UTC).toEpochMilliseconds()
}

/** UTC `YYYY-MM-DD` for the calendar date of [millis] in UTC. */
public fun utcMillisToDateKey(millis: Long): String {
    val date = Instant.fromEpochMilliseconds(millis).toLocalDateTime(TimeZone.UTC).date
    return formatUtcDateKey(date)
}

/** UTC calendar key for tomorrow (same convention as [todayKeyUtc]). */
public fun tomorrowKeyUtc(): String {
    val today = Clock.System.now().toLocalDateTime(TimeZone.UTC).date
    return formatUtcDateKey(today.plus(DatePeriod(days = 1)))
}

/**
 * Adds [days] to a valid UTC date key (same calendar rules as the web `addDaysToKey` helper).
 * @throws IllegalArgumentException if [dateKey] is not `YYYY-MM-DD`.
 */
public fun addDaysToDateKeyUtc(
    dateKey: String,
    days: Int,
): String {
    require(isValidTaskDateKey(dateKey)) { "invalid date key: $dateKey" }
    return formatUtcDateKey(LocalDate.parse(dateKey).plus(DatePeriod(days = days)))
}

/**
 * Adds [months] to a valid UTC date key (same calendar rules as the web `addMonthsToKey` helper).
 * @throws IllegalArgumentException if [dateKey] is not `YYYY-MM-DD`.
 */
public fun addMonthsToDateKeyUtc(
    dateKey: String,
    months: Int,
): String {
    require(isValidTaskDateKey(dateKey)) { "invalid date key: $dateKey" }
    return formatUtcDateKey(LocalDate.parse(dateKey).plus(DatePeriod(months = months)))
}
