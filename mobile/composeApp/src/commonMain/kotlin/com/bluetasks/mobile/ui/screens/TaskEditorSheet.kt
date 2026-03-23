package com.bluetasks.mobile.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.cancel
import com.bluetasks.mobile.generated.estimate_days
import com.bluetasks.mobile.generated.estimate_hours
import com.bluetasks.mobile.generated.estimate_minutes_short
import com.bluetasks.mobile.generated.filter_none
import com.bluetasks.mobile.generated.notes_checklist_progress
import com.bluetasks.mobile.generated.notes_done
import com.bluetasks.mobile.generated.notes_hint
import com.bluetasks.mobile.generated.notes_open_editor_desc
import com.bluetasks.mobile.generated.notes_preview_empty
import com.bluetasks.mobile.generated.priority_high
import com.bluetasks.mobile.generated.priority_low
import com.bluetasks.mobile.generated.priority_normal
import com.bluetasks.mobile.generated.recurrence_biweekly
import com.bluetasks.mobile.generated.recurrence_daily
import com.bluetasks.mobile.generated.recurrence_monthly
import com.bluetasks.mobile.generated.recurrence_none
import com.bluetasks.mobile.generated.recurrence_weekly
import com.bluetasks.mobile.generated.recurrence_yearly
import com.bluetasks.mobile.generated.task_category
import com.bluetasks.mobile.generated.task_date_clear
import com.bluetasks.mobile.generated.task_date_in_one_month
import com.bluetasks.mobile.generated.task_date_in_one_week
import com.bluetasks.mobile.generated.task_date_pick_cd
import com.bluetasks.mobile.generated.task_date_picker_confirm
import com.bluetasks.mobile.generated.task_date_shortcuts
import com.bluetasks.mobile.generated.task_date_today
import com.bluetasks.mobile.generated.task_date_tomorrow
import com.bluetasks.mobile.generated.task_delete
import com.bluetasks.mobile.generated.task_due_date_invalid
import com.bluetasks.mobile.generated.task_due_date_support
import com.bluetasks.mobile.generated.task_editor_title
import com.bluetasks.mobile.generated.task_estimate_menu_cd
import com.bluetasks.mobile.generated.task_estimate_none
import com.bluetasks.mobile.generated.task_field_due_date
import com.bluetasks.mobile.generated.task_field_title
import com.bluetasks.mobile.generated.task_pin
import com.bluetasks.mobile.generated.task_recurrence
import com.bluetasks.mobile.generated.task_section_due_date
import com.bluetasks.mobile.generated.task_section_estimate
import com.bluetasks.mobile.generated.task_section_priority
import com.bluetasks.mobile.generated.task_section_timer
import com.bluetasks.mobile.generated.task_time_spent
import com.bluetasks.mobile.generated.task_timer_start
import com.bluetasks.mobile.generated.task_timer_stop
import com.bluetasks.mobile.lexical.LexicalNotesEditor
import com.bluetasks.mobile.platform.isIosUi
import com.bluetasks.mobile.shared.api.ApiCategoryRow
import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.Recurrence
import com.bluetasks.mobile.shared.api.TaskPriority
import com.bluetasks.mobile.shared.domain.EMPTY_LEXICAL_JSON
import com.bluetasks.mobile.shared.domain.ESTIMATE_PRESET_MINUTES
import com.bluetasks.mobile.shared.domain.addDaysToDateKeyUtc
import com.bluetasks.mobile.shared.domain.addMonthsToDateKeyUtc
import com.bluetasks.mobile.shared.domain.dateKeyToUtcStartMillis
import com.bluetasks.mobile.shared.domain.formatDurationHms
import com.bluetasks.mobile.shared.domain.isValidTaskDateKey
import com.bluetasks.mobile.shared.domain.todayKeyUtc
import com.bluetasks.mobile.shared.domain.tomorrowKeyUtc
import com.bluetasks.mobile.shared.domain.totalDisplayedTimeSpentSeconds
import com.bluetasks.mobile.shared.domain.utcMillisToDateKey
import com.bluetasks.mobile.ui.components.TaskEditorFilterChip
import com.bluetasks.mobile.ui.components.TaskEditorTimerStartChipColors
import com.bluetasks.mobile.ui.components.categoryIconVector
import com.bluetasks.mobile.ui.theme.BlueTasksColors
import com.bluetasks.mobile.ui.theme.BlueTasksFilterChipTokens
import com.composables.icons.lucide.CalendarDays
import com.composables.icons.lucide.ChevronDown
import com.composables.icons.lucide.ChevronUp
import com.composables.icons.lucide.ChevronsDown
import com.composables.icons.lucide.ChevronsUp
import com.composables.icons.lucide.Equal
import com.composables.icons.lucide.Folder
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Pin
import com.composables.icons.lucide.Timer
import com.composables.icons.lucide.Trash2
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import org.jetbrains.compose.resources.stringResource

private val SectionAfterGap = 12.dp
private val WithinSectionGap = 8.dp
private val ChipRowEndPadding = 16.dp
private val ChipSpacing = 6.dp

private val NotesPreviewMinHeight = 88.dp
private val NotesPreviewShape = RoundedCornerShape(12.dp)

@Composable
private fun estimateMinutesLabel(minutes: Int): String =
    when {
        minutes >= 1440 && minutes % 1440 == 0 -> {
            val d = minutes / 1440
            stringResource(Res.string.estimate_days, d)
        }
        minutes >= 60 && minutes % 60 == 0 ->
            stringResource(Res.string.estimate_hours, minutes / 60)
        else -> stringResource(Res.string.estimate_minutes_short, minutes)
    }

@Composable
private fun EditorChipScrollRow(content: @Composable RowScope.() -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(ChipSpacing),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        content()
        Spacer(Modifier.width(ChipRowEndPadding))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun TaskEditorSheet(
    task: ApiTaskRow,
    categories: List<ApiCategoryRow>,
    onDismiss: () -> Unit,
    onSaveField: (ApiTaskRow) -> Unit,
    onDelete: () -> Unit,
    onToggleTimer: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var title by remember(task.id) { mutableStateOf(task.title) }
    var contentJson by remember(task.id) {
        mutableStateOf(task.contentJson.ifBlank { EMPTY_LEXICAL_JSON })
    }
    var contentText by remember(task.id) { mutableStateOf(task.contentText) }
    var checklistTotal by remember(task.id) { mutableStateOf(task.checklistTotal) }
    var checklistCompleted by remember(task.id) { mutableStateOf(task.checklistCompleted) }
    var dateKey by remember(task.id) { mutableStateOf(task.taskDate.orEmpty()) }
    var estimateMinutes by remember(task.id) { mutableStateOf<Int?>(task.estimateMinutes) }
    var priority by remember(task.id) { mutableStateOf(task.priority) }
    var pinned by remember(task.id) { mutableStateOf(task.pinned) }
    var recurrence by remember(task.id) { mutableStateOf(task.recurrence) }
    var categoryId by remember(task.id) { mutableStateOf(task.categoryId) }

    var showDatePicker by remember(task.id) { mutableStateOf(false) }
    var datePickerEpoch by remember(task.id) { mutableStateOf(0) }
    var estimateMenuExpanded by remember(task.id) { mutableStateOf(false) }
    var notesFullscreen by remember(task.id) { mutableStateOf(false) }

    LaunchedEffect(task.id, task.updatedAt) {
        title = task.title
        contentJson = task.contentJson.ifBlank { EMPTY_LEXICAL_JSON }
        contentText = task.contentText
        checklistTotal = task.checklistTotal
        checklistCompleted = task.checklistCompleted
        dateKey = task.taskDate.orEmpty()
        estimateMinutes = task.estimateMinutes
        priority = task.priority
        pinned = task.pinned
        recurrence = task.recurrence
        categoryId = task.categoryId
    }

    LaunchedEffect(task.id) {
        showDatePicker = false
        datePickerEpoch = 0
        estimateMenuExpanded = false
    }

    var now by remember { mutableStateOf(Clock.System.now()) }
    LaunchedEffect(task.timerStartedAt) {
        if (task.timerStartedAt == null) {
            now = Clock.System.now()
            return@LaunchedEffect
        }
        while (true) {
            delay(1000)
            now = Clock.System.now()
        }
    }

    fun buildTask(): ApiTaskRow =
        task.copy(
            title = title,
            contentText = contentText,
            contentJson = contentJson,
            checklistTotal = checklistTotal,
            checklistCompleted = checklistCompleted,
            taskDate = dateKey.ifBlank { null }?.takeIf { isValidTaskDateKey(it) },
            estimateMinutes = estimateMinutes,
            priority = priority,
            pinned = pinned,
            recurrence = recurrence,
            categoryId = categoryId,
        )

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val dateInvalid = dateKey.isNotBlank() && !isValidTaskDateKey(dateKey)

    key(datePickerEpoch) {
        val initialMillis =
            dateKeyToUtcStartMillis(dateKey) ?: dateKeyToUtcStartMillis(todayKeyUtc())!!
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(
                        onClick = {
                            datePickerState.selectedDateMillis?.let { millis ->
                                dateKey = utcMillisToDateKey(millis)
                                onSaveField(buildTask())
                            }
                            showDatePicker = false
                        },
                    ) {
                        Text(stringResource(Res.string.task_date_picker_confirm))
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false }) {
                        Text(stringResource(Res.string.cancel))
                    }
                },
            ) {
                DatePicker(state = datePickerState)
            }
        }
    }

    ModalBottomSheet(
        modifier = modifier,
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surfaceVariant,
        contentColor = MaterialTheme.colorScheme.onSurface,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp),
        ) {
            Text(stringResource(Res.string.task_editor_title), style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(WithinSectionGap))
            OutlinedTextField(
                value = title,
                onValueChange = {
                    title = it
                    onSaveField(buildTask())
                },
                label = { Text(stringResource(Res.string.task_field_title)) },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(WithinSectionGap))
            Text(stringResource(Res.string.notes_hint), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            val notesTapCd = stringResource(Res.string.notes_open_editor_desc)
            Surface(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .heightIn(min = NotesPreviewMinHeight)
                        .semantics { contentDescription = notesTapCd }
                        .clip(NotesPreviewShape)
                        .clickable(onClick = { notesFullscreen = true }),
                shape = NotesPreviewShape,
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, BlueTasksColors.BorderSubtle),
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text(
                        text =
                            if (contentText.isBlank()) {
                                stringResource(Res.string.notes_preview_empty)
                            } else {
                                contentText
                            },
                        maxLines = 4,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.bodyMedium,
                        color =
                            if (contentText.isBlank()) {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            },
                    )
                    if (checklistTotal > 0) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            stringResource(
                                Res.string.notes_checklist_progress,
                                checklistCompleted,
                                checklistTotal,
                            ),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_section_due_date), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            OutlinedTextField(
                value = dateKey,
                onValueChange = {
                    dateKey = it
                    onSaveField(buildTask())
                },
                label = { Text(stringResource(Res.string.task_field_due_date)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = dateInvalid,
                supportingText = {
                    Text(
                        if (dateInvalid) {
                            stringResource(Res.string.task_due_date_invalid)
                        } else {
                            stringResource(Res.string.task_due_date_support)
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color =
                            if (dateInvalid) {
                                MaterialTheme.colorScheme.error
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                    )
                },
                trailingIcon = {
                    IconButton(
                        onClick = {
                            datePickerEpoch++
                            showDatePicker = true
                        },
                    ) {
                        Icon(
                            Lucide.CalendarDays,
                            contentDescription = stringResource(Res.string.task_date_pick_cd),
                        )
                    }
                },
            )
            Spacer(Modifier.height(WithinSectionGap))
            Text(stringResource(Res.string.task_date_shortcuts), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            EditorChipScrollRow {
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_date_today),
                    selected = false,
                    onClick = {
                        dateKey = todayKeyUtc()
                        onSaveField(buildTask())
                    },
                )
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_date_tomorrow),
                    selected = false,
                    onClick = {
                        dateKey = tomorrowKeyUtc()
                        onSaveField(buildTask())
                    },
                )
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_date_in_one_week),
                    selected = false,
                    onClick = {
                        dateKey = addDaysToDateKeyUtc(todayKeyUtc(), 7)
                        onSaveField(buildTask())
                    },
                )
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_date_in_one_month),
                    selected = false,
                    onClick = {
                        dateKey = addMonthsToDateKeyUtc(todayKeyUtc(), 1)
                        onSaveField(buildTask())
                    },
                )
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_date_clear),
                    selected = false,
                    onClick = {
                        dateKey = ""
                        onSaveField(buildTask())
                    },
                )
            }
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_section_priority), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            EditorChipScrollRow {
                TaskPriority.entries.forEach { p ->
                    val label =
                        when (p) {
                            TaskPriority.low -> stringResource(Res.string.priority_low)
                            TaskPriority.normal -> stringResource(Res.string.priority_normal)
                            TaskPriority.high -> stringResource(Res.string.priority_high)
                        }
                    TaskEditorFilterChip(
                        label = label,
                        selected = priority == p,
                        onClick = {
                            priority = p
                            onSaveField(buildTask())
                        },
                        leadingIcon = {
                            val glyph =
                                when (p) {
                                    TaskPriority.low -> Lucide.ChevronsDown
                                    TaskPriority.normal -> Lucide.Equal
                                    TaskPriority.high -> Lucide.ChevronsUp
                                }
                            Icon(
                                glyph,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        },
                    )
                }
            }
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_section_timer), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            EditorChipScrollRow {
                TaskEditorFilterChip(
                    label = stringResource(Res.string.task_pin),
                    selected = pinned,
                    onClick = {
                        pinned = !pinned
                        onSaveField(buildTask())
                    },
                    leadingIcon = {
                        Icon(
                            Lucide.Pin,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                )
                val timerOn = task.timerStartedAt != null
                TaskEditorFilterChip(
                    label =
                        if (timerOn) {
                            stringResource(Res.string.task_timer_stop)
                        } else {
                            stringResource(Res.string.task_timer_start)
                        },
                    selected = timerOn,
                    onClick = onToggleTimer,
                    leadingIcon = {
                        Icon(
                            Lucide.Timer,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint =
                                if (timerOn) {
                                    LocalContentColor.current
                                } else {
                                    MaterialTheme.colorScheme.onPrimary
                                },
                        )
                    },
                    colors =
                        if (timerOn) {
                            BlueTasksFilterChipTokens.colors()
                        } else {
                            TaskEditorTimerStartChipColors()
                        },
                    border =
                        if (timerOn) {
                            BlueTasksFilterChipTokens.border(selected = true)
                        } else {
                            FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = false,
                                borderColor = MaterialTheme.colorScheme.primary,
                                selectedBorderColor = MaterialTheme.colorScheme.primary,
                            )
                        },
                )
            }
            val displayedSec = totalDisplayedTimeSpentSeconds(task.timeSpentSeconds, task.timerStartedAt, now)
            Spacer(Modifier.height(4.dp))
            Text(
                stringResource(Res.string.task_time_spent, formatDurationHms(displayedSec)),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_section_estimate), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            val estimateDisplay =
                estimateMinutes?.let { estimateMinutesLabel(it) }
                    ?: stringResource(Res.string.task_estimate_none)
            val estimateFieldInteractionSource = remember { MutableInteractionSource() }
            Box(Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = estimateDisplay,
                    onValueChange = {},
                    readOnly = true,
                    singleLine = true,
                    trailingIcon = {
                        IconButton(onClick = { estimateMenuExpanded = !estimateMenuExpanded }) {
                            Icon(
                                imageVector =
                                    if (estimateMenuExpanded) {
                                        Lucide.ChevronUp
                                    } else {
                                        Lucide.ChevronDown
                                    },
                                contentDescription = stringResource(Res.string.task_estimate_menu_cd),
                            )
                        }
                    },
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .clickable(
                                interactionSource = estimateFieldInteractionSource,
                                indication = null,
                                onClick = { estimateMenuExpanded = true },
                            ),
                )
                DropdownMenu(
                    expanded = estimateMenuExpanded,
                    onDismissRequest = { estimateMenuExpanded = false },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    ESTIMATE_PRESET_MINUTES.forEach { minutes ->
                        DropdownMenuItem(
                            text = { Text(estimateMinutesLabel(minutes)) },
                            onClick = {
                                estimateMinutes = minutes
                                estimateMenuExpanded = false
                                onSaveField(buildTask())
                            },
                        )
                    }
                    DropdownMenuItem(
                        text = { Text(stringResource(Res.string.task_estimate_none)) },
                        onClick = {
                            estimateMinutes = null
                            estimateMenuExpanded = false
                            onSaveField(buildTask())
                        },
                    )
                }
            }
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_recurrence), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            EditorChipScrollRow {
                TaskEditorFilterChip(
                    label = stringResource(Res.string.recurrence_none),
                    selected = recurrence == null,
                    onClick = {
                        recurrence = null
                        onSaveField(buildTask())
                    },
                )
                Recurrence.entries.forEach { r ->
                    val label =
                        when (r) {
                            Recurrence.daily -> stringResource(Res.string.recurrence_daily)
                            Recurrence.weekly -> stringResource(Res.string.recurrence_weekly)
                            Recurrence.biweekly -> stringResource(Res.string.recurrence_biweekly)
                            Recurrence.monthly -> stringResource(Res.string.recurrence_monthly)
                            Recurrence.yearly -> stringResource(Res.string.recurrence_yearly)
                        }
                    TaskEditorFilterChip(
                        label = label,
                        selected = recurrence == r,
                        onClick = {
                            recurrence = r
                            onSaveField(buildTask())
                        },
                    )
                }
            }
            Spacer(Modifier.height(SectionAfterGap))
            Text(stringResource(Res.string.task_category), style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            EditorChipScrollRow {
                TaskEditorFilterChip(
                    label = stringResource(Res.string.filter_none),
                    selected = categoryId == null,
                    onClick = {
                        categoryId = null
                        onSaveField(buildTask())
                    },
                    leadingIcon = {
                        Icon(
                            Lucide.Folder,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                )
                categories.forEach { c ->
                    TaskEditorFilterChip(
                        label = c.name,
                        selected = categoryId == c.id,
                        onClick = {
                            categoryId = c.id
                            onSaveField(buildTask())
                        },
                        leadingIcon = {
                            Icon(
                                categoryIconVector(c.icon),
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        },
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(onClick = onDelete, modifier = Modifier.fillMaxWidth()) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Lucide.Trash2, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(Res.string.task_delete))
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }

    if (notesFullscreen) {
        Dialog(
            onDismissRequest = { notesFullscreen = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = BlueTasksColors.Canvas,
            ) {
                Column(Modifier.fillMaxSize()) {
                    if (isIosUi()) {
                        Row(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .statusBarsPadding()
                                    .padding(horizontal = 4.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Spacer(Modifier.width(8.dp))
                            Text(
                                stringResource(Res.string.notes_hint),
                                style = MaterialTheme.typography.titleLarge,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.Center,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                            TextButton(onClick = { notesFullscreen = false }) {
                                Text(stringResource(Res.string.notes_done))
                            }
                        }
                        HorizontalDivider(
                            thickness = 1.dp,
                            color = BlueTasksColors.BorderSubtle,
                        )
                    } else {
                        TopAppBar(
                            title = { Text(stringResource(Res.string.notes_hint)) },
                            navigationIcon = {
                                IconButton(onClick = { notesFullscreen = false }) {
                                    Icon(
                                        Icons.Filled.Close,
                                        contentDescription = stringResource(Res.string.cancel),
                                    )
                                }
                            },
                            colors =
                                TopAppBarDefaults.topAppBarColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                                ),
                        )
                    }
                    LexicalNotesEditor(
                        contentJson = contentJson,
                        placeholder = stringResource(Res.string.notes_hint),
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        onChange = { json, plain, total, done ->
                            contentJson = json
                            contentText = plain
                            checklistTotal = total
                            checklistCompleted = done
                            onSaveField(buildTask())
                        },
                    )
                }
            }
        }
    }
}
