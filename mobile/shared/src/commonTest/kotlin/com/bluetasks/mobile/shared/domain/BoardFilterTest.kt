package com.bluetasks.mobile.shared.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class BoardFilterTest {
    private val taskPending =
        BoardFilterTask(
            status = "pending",
            taskDate = "2025-01-10",
            categoryId = "cat-1",
        )

    @Test
    fun categoryAllMatches() {
        assertTrue(taskMatchesCategoryFilterRow(taskPending, FILTER_CATEGORY_ALL))
    }

    @Test
    fun categoryUncategorized() {
        assertFalse(taskMatchesCategoryFilterRow(taskPending, FILTER_CATEGORY_UNCATEGORIZED))
        assertTrue(
            taskMatchesCategoryFilterRow(
                taskPending.copy(categoryId = null),
                FILTER_CATEGORY_UNCATEGORIZED,
            ),
        )
    }

    @Test
    fun sectionDone() {
        assertTrue(
            taskMatchesBoardSectionRow(
                taskPending.copy(status = "completed"),
                SECTION_DONE,
                "2025-01-15",
            ),
        )
        assertFalse(taskMatchesBoardSectionRow(taskPending, SECTION_DONE, "2025-01-15"))
    }

    @Test
    fun sectionTodayVsUpcoming() {
        val today = "2025-01-15"
        assertTrue(taskMatchesBoardSectionRow(taskPending.copy(taskDate = today), SECTION_TODAY, today))
        assertTrue(taskMatchesBoardSectionRow(taskPending.copy(taskDate = "2025-01-01"), SECTION_TODAY, today))
        assertFalse(taskMatchesBoardSectionRow(taskPending.copy(taskDate = "2025-01-20"), SECTION_TODAY, today))
        assertTrue(taskMatchesBoardSectionRow(taskPending.copy(taskDate = "2025-01-20"), SECTION_UPCOMING, today))
    }

    @Test
    fun sectionAnytime() {
        val today = "2025-01-15"
        assertTrue(taskMatchesBoardSectionRow(taskPending.copy(taskDate = null), SECTION_ANYTIME, today))
    }

    @Test
    fun getTaskSectionBucket() {
        val today = "2025-01-15"
        assertEquals(SECTION_DONE, getTaskSectionBucket(taskPending.copy(status = "completed"), today))
        assertEquals(SECTION_ANYTIME, getTaskSectionBucket(taskPending.copy(taskDate = null), today))
        assertEquals(SECTION_TODAY, getTaskSectionBucket(taskPending.copy(taskDate = "2025-01-01"), today))
        assertEquals(SECTION_UPCOMING, getTaskSectionBucket(taskPending.copy(taskDate = "2025-12-31"), today))
    }
}
