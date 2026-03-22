package com.bluetasks.mobile.shared.domain

/** Category sidebar: every category */
public const val FILTER_CATEGORY_ALL: String = "all"

/** Category sidebar: tasks with no category */
public const val FILTER_CATEGORY_UNCATEGORIZED: String = "uncategorized"

public typealias TaskSectionBucket = String

public const val SECTION_TODAY: String = "today"
public const val SECTION_UPCOMING: String = "upcoming"
public const val SECTION_ANYTIME: String = "anytime"
public const val SECTION_DONE: String = "done"
public const val SECTION_ALL: String = "all"

public typealias BoardSectionId = String

public data class BoardFilterTask(
    val status: String,
    val taskDate: String?,
    val categoryId: String?,
)

public fun taskMatchesCategoryFilterRow(
    task: BoardFilterTask,
    categoryFilter: String,
): Boolean =
    when (categoryFilter) {
        FILTER_CATEGORY_ALL -> true
        FILTER_CATEGORY_UNCATEGORIZED -> task.categoryId.isNullOrEmpty()
        else -> task.categoryId == categoryFilter
    }

public fun taskMatchesBoardSectionRow(
    task: BoardFilterTask,
    section: BoardSectionId,
    today: String,
): Boolean {
    if (section == SECTION_ALL) {
        return true
    }
    if (section == SECTION_DONE) {
        return task.status == "completed"
    }
    if (task.status == "completed") {
        return false
    }
    if (section == SECTION_TODAY) {
        val d = task.taskDate
        return d != null && d <= today
    }
    if (section == SECTION_UPCOMING) {
        val d = task.taskDate
        return d != null && d > today
    }
    return task.taskDate.isNullOrEmpty()
}

public fun getTaskSectionBucket(
    task: BoardFilterTask,
    today: String,
): TaskSectionBucket =
    when {
        task.status == "completed" -> SECTION_DONE
        task.taskDate.isNullOrEmpty() -> SECTION_ANYTIME
        task.taskDate!! <= today -> SECTION_TODAY
        else -> SECTION_UPCOMING
    }
