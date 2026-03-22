package com.bluetasks.mobile

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bluetasks.mobile.generated.resources.Res
import com.bluetasks.mobile.generated.resources.add_task
import com.bluetasks.mobile.generated.resources.app_name
import com.bluetasks.mobile.generated.resources.categories_tab
import com.bluetasks.mobile.generated.resources.connect
import com.bluetasks.mobile.generated.resources.export_db
import com.bluetasks.mobile.generated.resources.general_tab
import com.bluetasks.mobile.generated.resources.import_db
import com.bluetasks.mobile.generated.resources.loading
import com.bluetasks.mobile.generated.resources.notes_hint
import com.bluetasks.mobile.generated.resources.notes_phase_a
import com.bluetasks.mobile.generated.resources.quick_capture_hint
import com.bluetasks.mobile.generated.resources.server_url_hint
import com.bluetasks.mobile.generated.resources.settings
import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.Recurrence
import com.bluetasks.mobile.shared.api.TaskPriority
import com.bluetasks.mobile.shared.api.TaskStatus
import com.bluetasks.mobile.shared.domain.CATEGORY_ICON_IDS
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_ALL
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_UNCATEGORIZED
import com.bluetasks.mobile.ui.theme.BlueTasksTheme
import kotlinx.coroutines.flow.collectLatest
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun App(fileBridge: FileBridge) {
    BlueTasksTheme {
        val vm: BlueTasksAppViewModel = viewModel { BlueTasksAppViewModel() }
        val state by vm.state.collectAsState()

        LaunchedEffect(Unit) {
            vm.effects.collectLatest { effect ->
                when (effect) {
                    is AppEffect.ShareSqlite -> fileBridge.shareSqlite(effect.bytes, effect.filename)
                    AppEffect.LaunchImportPicker -> fileBridge.launchImport { bytes -> vm.onImportFileSelected(bytes) }
                }
            }
        }

        if (state.savedBaseUrl.isEmpty() && !state.loading) {
            ConnectScreen(
                baseUrl = state.baseUrlDraft,
                onBaseUrlChange = vm::updateBaseUrlDraft,
                onConnect = { vm.connect() },
                error = state.error,
            )
            return@BlueTasksTheme
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.app_name)) },
                    actions = {
                        IconButton(onClick = { vm.openSettings(true) }) {
                            Icon(Icons.Default.Settings, contentDescription = stringResource(Res.string.settings))
                        }
                    },
                )
            },
            bottomBar = {
                NavigationBar {
                    BlueTasksAppViewModel.sectionIds.forEach { sid ->
                        val label =
                            when (sid) {
                                "today" -> "Today"
                                "upcoming" -> "Upcoming"
                                "anytime" -> "Anytime"
                                "done" -> "Done"
                                else -> "All"
                            }
                        NavigationBarItem(
                            selected = state.section == sid,
                            onClick = { vm.setSection(sid) },
                            label = { Text(label) },
                            icon = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                        )
                    }
                }
            },
        ) { padding ->
            Column(Modifier.padding(padding).fillMaxSize()) {
                if (state.loading) {
                    LinearProgressIndicator(Modifier.fillMaxWidth())
                }
                state.error?.let { err ->
                    Text(
                        text = err,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(8.dp),
                    )
                }
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedTextField(
                        value = state.quickCaptureText,
                        onValueChange = vm::updateQuickCapture,
                        modifier = Modifier.weight(1f),
                        placeholder = { Text(stringResource(Res.string.quick_capture_hint)) },
                        singleLine = true,
                    )
                    Button(onClick = { vm.submitQuickCapture() }) {
                        Text(stringResource(Res.string.add_task))
                    }
                }
                CategoryChipsRow(
                    categories = state.categories,
                    selected = state.categoryFilter,
                    onSelect = vm::setCategoryFilter,
                )
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    items(state.visibleTasks, key = { it.id }) { task ->
                        TaskRowCard(
                            task = task,
                            onOpen = { vm.selectTask(task.id) },
                            onToggleDone = { vm.toggleTaskCompleted(task) },
                        )
                    }
                }
            }
        }

        if (state.selectedTaskId != null) {
            val task = state.selectedTask
            if (task != null) {
                TaskEditorSheet(
                    task = task,
                    categories = state.categories,
                    onDismiss = { vm.selectTask(null) },
                    onSaveField = { updated -> vm.scheduleTaskSave(updated) },
                    onDelete = {
                        vm.deleteTask(task.id)
                        vm.selectTask(null)
                    },
                    onToggleTimer = { vm.toggleTimer(task) },
                )
            }
        }

        if (state.settingsOpen) {
            SettingsSheet(
                state = state,
                vm = vm,
                onDismiss = { vm.openSettings(false) },
                onExport = { vm.requestExportDatabase() },
                onImportClick = { vm.requestImportPicker() },
            )
        }

        if (state.confirmImportPending && state.confirmReplaceServerDb != null) {
            AlertDialog(
                onDismissRequest = { vm.cancelImportConfirm() },
                title = { Text("Replace server database?") },
                text = { Text("This overwrites the BlueTasks SQLite file on the server. This cannot be undone.") },
                confirmButton = {
                    Button(onClick = { vm.confirmImportReplace() }) {
                        Text("Replace")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { vm.cancelImportConfirm() }) {
                        Text("Cancel")
                    }
                },
            )
        }
    }
}

@Composable
private fun ConnectScreen(
    baseUrl: String,
    onBaseUrlChange: (String) -> Unit,
    onConnect: () -> Unit,
    error: String?,
) {
    Column(Modifier.padding(24.dp).fillMaxSize(), verticalArrangement = Arrangement.Center) {
        Text(stringResource(Res.string.app_name), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = baseUrl,
            onValueChange = onBaseUrlChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text(stringResource(Res.string.server_url_hint)) },
            singleLine = true,
        )
        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = onConnect, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(Res.string.connect))
        }
    }
}

@Composable
private fun CategoryChipsRow(
    categories: List<com.bluetasks.mobile.shared.api.ApiCategoryRow>,
    selected: String,
    onSelect: (String) -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        FilterChip(selected == FILTER_CATEGORY_ALL, { onSelect(FILTER_CATEGORY_ALL) }, { Text("All") })
        FilterChip(
            selected == FILTER_CATEGORY_UNCATEGORIZED,
            { onSelect(FILTER_CATEGORY_UNCATEGORIZED) },
            { Text("None") },
        )
        categories.forEach { c ->
            FilterChip(selected == c.id, { onSelect(c.id) }, { Text(c.name) })
        }
    }
}

@Composable
private fun TaskRowCard(
    task: ApiTaskRow,
    onOpen: () -> Unit,
    onToggleDone: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(),
    ) {
        Row(
            Modifier.padding(12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(Modifier.weight(1f)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium)
                task.taskDate?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
            }
            TextButton(onClick = onToggleDone) {
                Text(if (task.status == TaskStatus.completed) "Undo" else "Done")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TaskEditorSheet(
    task: ApiTaskRow,
    categories: List<com.bluetasks.mobile.shared.api.ApiCategoryRow>,
    onDismiss: () -> Unit,
    onSaveField: (ApiTaskRow) -> Unit,
    onDelete: () -> Unit,
    onToggleTimer: () -> Unit,
) {
    var title by remember(task.id) { mutableStateOf(task.title) }
    var notes by remember(task.id) { mutableStateOf(task.contentText) }
    var dateKey by remember(task.id) { mutableStateOf(task.taskDate.orEmpty()) }
    var estimate by remember(task.id) { mutableStateOf(task.estimateMinutes?.toString().orEmpty()) }
    var priority by remember(task.id) { mutableStateOf(task.priority) }
    var pinned by remember(task.id) { mutableStateOf(task.pinned) }
    var recurrence by remember(task.id) { mutableStateOf(task.recurrence) }
    var categoryId by remember(task.id) { mutableStateOf(task.categoryId) }

    fun buildTask(): ApiTaskRow =
        task.copy(
            title = title,
            contentText = notes,
            contentJson = task.contentJson,
            taskDate = dateKey.ifBlank { null }?.takeIf { it.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$")) },
            estimateMinutes = estimate.toIntOrNull(),
            priority = priority,
            pinned = pinned,
            recurrence = recurrence,
            categoryId = categoryId,
        )

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(Modifier.padding(16.dp).fillMaxWidth()) {
            Text("Task", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = title,
                onValueChange = {
                    title = it
                    onSaveField(buildTask())
                },
                label = { Text("Title") },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Text(stringResource(Res.string.notes_phase_a), style = MaterialTheme.typography.labelSmall)
            OutlinedTextField(
                value = notes,
                onValueChange = {
                    notes = it
                    onSaveField(buildTask())
                },
                label = { Text(stringResource(Res.string.notes_hint)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = dateKey,
                onValueChange = {
                    dateKey = it
                    onSaveField(buildTask())
                },
                label = { Text("Due YYYY-MM-DD") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TaskPriority.values().forEach { p ->
                    FilterChip(priority == p, { priority = p; onSaveField(buildTask()) }, { Text(p.name) })
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(pinned, { pinned = !pinned; onSaveField(buildTask()) }, { Text("Pin") })
                Button(onClick = onToggleTimer) {
                    Text(
                        if (task.timerStartedAt != null) {
                            "Stop timer"
                        } else {
                            "Start timer"
                        },
                    )
                }
            }
            Text("Spent: ${task.timeSpentSeconds}s", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = estimate,
                onValueChange = {
                    estimate = it
                    onSaveField(buildTask())
                },
                label = { Text("Estimate min") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Spacer(Modifier.height(8.dp))
            Text("Recurrence", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(recurrence == null, { recurrence = null; onSaveField(buildTask()) }, { Text("None") })
                enumValues<Recurrence>().forEach { r ->
                    FilterChip(recurrence == r, { recurrence = r; onSaveField(buildTask()) }, { Text(r.name) })
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("Category", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(categoryId == null, { categoryId = null; onSaveField(buildTask()) }, { Text("None") })
                categories.forEach { c ->
                    FilterChip(categoryId == c.id, { categoryId = c.id; onSaveField(buildTask()) }, { Text(c.name) })
                }
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(onClick = onDelete, modifier = Modifier.fillMaxWidth()) {
                Text("Delete task")
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsSheet(
    state: AppUiState,
    vm: BlueTasksAppViewModel,
    onDismiss: () -> Unit,
    onExport: () -> Unit,
    onImportClick: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    state.settingsTab == SettingsTab.General,
                    { vm.setSettingsTab(SettingsTab.General) },
                    { Text(stringResource(Res.string.general_tab)) },
                )
                FilterChip(
                    state.settingsTab == SettingsTab.Categories,
                    { vm.setSettingsTab(SettingsTab.Categories) },
                    { Text(stringResource(Res.string.categories_tab)) },
                )
            }
            Spacer(Modifier.height(16.dp))
            when (state.settingsTab) {
                SettingsTab.General -> {
                    OutlinedTextField(
                        value = state.baseUrlDraft,
                        onValueChange = vm::updateBaseUrlDraft,
                        label = { Text(stringResource(Res.string.server_url_hint)) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { vm.connect() }, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.connect))
                    }
                    Spacer(Modifier.height(16.dp))
                    Button(onClick = onExport, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.export_db))
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = onImportClick, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.import_db))
                    }
                    state.importExportBanner?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, style = MaterialTheme.typography.bodySmall)
                    }
                }
                SettingsTab.Categories -> {
                    OutlinedTextField(
                        value = state.newCategoryName,
                        onValueChange = vm::updateNewCategoryName,
                        label = { Text("New category") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    Text("Icon: ${state.newCategoryIcon}")
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        CATEGORY_ICON_IDS.take(8).forEach { id ->
                            FilterChip(
                                state.newCategoryIcon == id,
                                {
                                    vm.updateNewCategoryIcon(id)
                                },
                                { Text(id.take(4)) },
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { vm.addCategory() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Add category")
                    }
                    Spacer(Modifier.height(16.dp))
                    state.categories.forEach { c ->
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("${c.name} (${c.icon})")
                            TextButton(onClick = { vm.deleteCategory(c.id) }) {
                                Text("Delete")
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

/** Platform hooks for import/export (Android: Storage Access Framework + share sheet). */
public interface FileBridge {
    public fun shareSqlite(bytes: ByteArray, filename: String)
    public fun launchImport(onResult: (ByteArray?) -> Unit)
}
