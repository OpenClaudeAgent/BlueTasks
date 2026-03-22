package com.bluetasks.mobile.shared.domain

import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.TaskPriority
import com.bluetasks.mobile.shared.api.TaskStatus
import kotlin.test.Test
import kotlin.test.assertEquals

class TaskBoardTest {
    private fun task(
        id: String,
        status: TaskStatus = TaskStatus.pending,
        taskDate: String? = null,
        categoryId: String? = null,
        pinned: Boolean = false,
        createdAt: String = "2025-01-01T00:00:00.000Z",
    ): ApiTaskRow =
        ApiTaskRow(
            id = id,
            title = "t",
            status = status,
            taskDate = taskDate,
            contentJson = EMPTY_LEXICAL_JSON,
            contentText = "",
            checklistTotal = 0,
            checklistCompleted = 0,
            priority = TaskPriority.normal,
            estimateMinutes = null,
            pinned = pinned,
            timeSpentSeconds = 0,
            timerStartedAt = null,
            recurrence = null,
            categoryId = categoryId,
            createdAt = createdAt,
            updatedAt = createdAt,
        )

    @Test
    fun sortPinnedFirstThenDate() {
        val tasks =
            listOf(
                task("x", taskDate = "2025-01-02", pinned = false, createdAt = "2025-01-01T00:00:00.000Z"),
                task("y", taskDate = "2025-01-01", pinned = true, createdAt = "2025-01-02T00:00:00.000Z"),
            )
        val sorted = sortTasks(tasks).map { it.id }
        assertEquals(listOf("y", "x"), sorted)
    }
}
