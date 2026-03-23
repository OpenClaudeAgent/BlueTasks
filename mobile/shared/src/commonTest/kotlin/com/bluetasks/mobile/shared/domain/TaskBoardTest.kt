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

    @Test
    fun sortPendingBeforeCompletedWhenSamePinAndDate() {
        val tasks =
            listOf(
                task("done-later", status = TaskStatus.completed, taskDate = "2025-01-10"),
                task("pending-first", status = TaskStatus.pending, taskDate = "2025-01-10"),
            )
        val sorted = sortTasks(tasks).map { it.id }
        assertEquals(listOf("pending-first", "done-later"), sorted)
    }

    @Test
    fun toWritePayload_preservesWritableFields() {
        val t =
            task("a550e840-e29b-41d4-a716-446655440001").copy(
                title = "Hello",
                pinned = true,
                timeSpentSeconds = 99,
            )
        val p = toWritePayload(t)
        assertEquals(t.id, p.id)
        assertEquals(t.title, p.title)
        assertEquals(t.pinned, p.pinned)
        assertEquals(t.timeSpentSeconds, p.timeSpentSeconds)
        assertEquals(t.contentJson, p.contentJson)
    }
}
