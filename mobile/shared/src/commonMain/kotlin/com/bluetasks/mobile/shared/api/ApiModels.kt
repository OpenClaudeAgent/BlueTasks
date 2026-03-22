package com.bluetasks.mobile.shared.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
public enum class TaskStatus {
    pending,
    completed,
}

@Serializable
public enum class TaskPriority {
    low,
    normal,
    high,
}

@Serializable
public enum class Recurrence {
    daily,
    weekly,
    biweekly,
    monthly,
    yearly,
}

@Serializable
public data class ApiTaskRow(
    val id: String,
    val title: String,
    val status: TaskStatus,
    @SerialName("taskDate") val taskDate: String? = null,
    @SerialName("contentJson") val contentJson: String,
    @SerialName("contentText") val contentText: String,
    @SerialName("checklistTotal") val checklistTotal: Int,
    @SerialName("checklistCompleted") val checklistCompleted: Int,
    val priority: TaskPriority,
    @SerialName("estimateMinutes") val estimateMinutes: Int? = null,
    val pinned: Boolean,
    @SerialName("timeSpentSeconds") val timeSpentSeconds: Int,
    @SerialName("timerStartedAt") val timerStartedAt: String? = null,
    val recurrence: Recurrence? = null,
    @SerialName("categoryId") val categoryId: String? = null,
    @SerialName("createdAt") val createdAt: String,
    @SerialName("updatedAt") val updatedAt: String,
)

@Serializable
public data class ApiCategoryRow(
    val id: String,
    val name: String,
    val icon: String,
    @SerialName("sortIndex") val sortIndex: Int,
    @SerialName("createdAt") val createdAt: String,
)

@Serializable
public data class CreateCategoryBody(
    val name: String,
    val icon: String? = null,
)

@Serializable
public data class UpdateCategoryBody(
    val name: String,
    val icon: String? = null,
)

@Serializable
public data class TaskWritePayload(
    val id: String? = null,
    val title: String,
    val status: TaskStatus,
    @SerialName("taskDate") val taskDate: String? = null,
    @SerialName("contentJson") val contentJson: String,
    @SerialName("contentText") val contentText: String,
    @SerialName("checklistTotal") val checklistTotal: Int,
    @SerialName("checklistCompleted") val checklistCompleted: Int,
    val priority: TaskPriority,
    @SerialName("estimateMinutes") val estimateMinutes: Int? = null,
    val pinned: Boolean,
    @SerialName("timeSpentSeconds") val timeSpentSeconds: Int,
    @SerialName("timerStartedAt") val timerStartedAt: String? = null,
    val recurrence: Recurrence? = null,
    @SerialName("categoryId") val categoryId: String? = null,
)
