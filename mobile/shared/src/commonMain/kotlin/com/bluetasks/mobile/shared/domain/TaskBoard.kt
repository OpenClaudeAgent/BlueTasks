package com.bluetasks.mobile.shared.domain

import com.benasher44.uuid.uuid4
import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.TaskPriority
import com.bluetasks.mobile.shared.api.TaskStatus
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/** UTC calendar key YYYY-MM-DD (matches web `new Date().toISOString().slice(0, 10)`). */
public fun todayKeyUtc(): String {
    val instant = Clock.System.now()
    val d = instant.toLocalDateTime(TimeZone.UTC).date
    val m = d.monthNumber.toString().padStart(2, '0')
    val day = d.dayOfMonth.toString().padStart(2, '0')
    return "${d.year}-$m-$day"
}

public fun toBoardFilterTask(task: ApiTaskRow): BoardFilterTask =
    BoardFilterTask(
        status = task.status.name,
        taskDate = task.taskDate,
        categoryId = task.categoryId,
    )

public fun filterTasks(
    tasks: List<ApiTaskRow>,
    section: BoardSectionId,
    categoryFilter: String = FILTER_CATEGORY_ALL,
): List<ApiTaskRow> {
    val today = todayKeyUtc()
    return sortTasks(
        tasks.filter { task ->
            val row = toBoardFilterTask(task)
            taskMatchesCategoryFilterRow(row, categoryFilter) &&
                taskMatchesBoardSectionRow(row, section, today)
        },
    )
}

public data class CategorySidebarCounts(
    val all: Int,
    val uncategorized: Int,
    val byId: Map<String, Int>,
)

public fun getCategorySidebarCounts(
    tasks: List<ApiTaskRow>,
    selectedSection: BoardSectionId,
    categoryIds: List<String>,
): CategorySidebarCounts {
    val today = todayKeyUtc()
    val byId = categoryIds.associateWith { 0 }.toMutableMap()
    var all = 0
    var uncategorized = 0
    for (task in tasks) {
        val row = toBoardFilterTask(task)
        if (!taskMatchesBoardSectionRow(row, selectedSection, today)) {
            continue
        }
        if (taskMatchesCategoryFilterRow(row, FILTER_CATEGORY_ALL)) {
            all++
        }
        if (taskMatchesCategoryFilterRow(row, FILTER_CATEGORY_UNCATEGORIZED)) {
            uncategorized++
        }
        for (id in categoryIds) {
            if (taskMatchesCategoryFilterRow(row, id)) {
                byId[id] = (byId[id] ?: 0) + 1
            }
        }
    }
    return CategorySidebarCounts(all, uncategorized, byId)
}

public data class TaskCounts(
    val all: Int,
    val today: Int,
    val upcoming: Int,
    val anytime: Int,
    val done: Int,
)

public fun getTaskCounts(
    tasks: List<ApiTaskRow>,
    categoryFilter: String = FILTER_CATEGORY_ALL,
): TaskCounts =
    TaskCounts(
        all = filterTasks(tasks, SECTION_ALL, categoryFilter).size,
        today = filterTasks(tasks, SECTION_TODAY, categoryFilter).size,
        upcoming = filterTasks(tasks, SECTION_UPCOMING, categoryFilter).size,
        anytime = filterTasks(tasks, SECTION_ANYTIME, categoryFilter).size,
        done = filterTasks(tasks, SECTION_DONE, categoryFilter).size,
    )

public fun sortTasks(tasks: List<ApiTaskRow>): List<ApiTaskRow> =
    tasks.sortedWith(
        compareBy<ApiTaskRow> { it.status != TaskStatus.pending }
            .thenByDescending { it.pinned }
            .thenBy { it.taskDate ?: "9999-12-31" }
            .thenBy { it.createdAt }
            .thenBy { it.id },
    )

public const val EMPTY_LEXICAL_JSON: String =
    """{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}"""

public fun newTaskDraft(
    title: String,
    categoryId: String?,
): ApiTaskRow {
    val now: String = Clock.System.now().toString()
    val id = uuid4().toString()
    return ApiTaskRow(
        id = id,
        title = title.trim().ifEmpty { "Untitled task" },
        status = TaskStatus.pending,
        taskDate = null,
        contentJson = EMPTY_LEXICAL_JSON,
        contentText = "",
        checklistTotal = 0,
        checklistCompleted = 0,
        priority = TaskPriority.normal,
        estimateMinutes = null,
        pinned = false,
        timeSpentSeconds = 0,
        timerStartedAt = null,
        recurrence = null,
        categoryId = categoryId?.takeIf { it.isNotEmpty() },
        createdAt = now,
        updatedAt = now,
    )
}

public fun toWritePayload(task: ApiTaskRow): com.bluetasks.mobile.shared.api.TaskWritePayload =
    com.bluetasks.mobile.shared.api.TaskWritePayload(
        id = task.id,
        title = task.title,
        status = task.status,
        taskDate = task.taskDate,
        contentJson = task.contentJson,
        contentText = task.contentText,
        checklistTotal = task.checklistTotal,
        checklistCompleted = task.checklistCompleted,
        priority = task.priority,
        estimateMinutes = task.estimateMinutes,
        pinned = task.pinned,
        timeSpentSeconds = task.timeSpentSeconds,
        timerStartedAt = task.timerStartedAt,
        recurrence = task.recurrence,
        categoryId = task.categoryId,
    )
