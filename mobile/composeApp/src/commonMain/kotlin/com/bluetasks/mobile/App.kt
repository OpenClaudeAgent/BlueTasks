package com.bluetasks.mobile

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.cancel
import com.bluetasks.mobile.generated.import_replace_confirm
import com.bluetasks.mobile.generated.import_replace_message
import com.bluetasks.mobile.generated.import_replace_title
import com.bluetasks.mobile.generated.settings_delete
import com.bluetasks.mobile.generated.settings_delete_category_message
import com.bluetasks.mobile.generated.settings_delete_category_title
import com.bluetasks.mobile.generated.settings_delete_category_with_tasks
import com.bluetasks.mobile.ui.screens.ConnectScreen
import com.bluetasks.mobile.ui.screens.MainBoardScreen
import com.bluetasks.mobile.ui.screens.SettingsSheet
import com.bluetasks.mobile.ui.screens.TaskEditorSheet
import com.bluetasks.mobile.ui.theme.BlueTasksTheme
import kotlinx.coroutines.flow.collectLatest
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun App(fileBridge: FileBridge) {
    BlueTasksTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
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
                return@Surface
            }

            MainBoardScreen(state = state, vm = vm)

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
                )
            }

            if (state.confirmImportPending && state.confirmReplaceServerDb != null) {
                AlertDialog(
                    onDismissRequest = { vm.cancelImportConfirm() },
                    title = { Text(stringResource(Res.string.import_replace_title)) },
                    text = { Text(stringResource(Res.string.import_replace_message)) },
                    confirmButton = {
                        Button(onClick = { vm.confirmImportReplace() }) {
                            Text(stringResource(Res.string.import_replace_confirm))
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { vm.cancelImportConfirm() }) {
                            Text(stringResource(Res.string.cancel))
                        }
                    },
                )
            }

            state.pendingCategoryDelete?.let { pending ->
                val msg =
                    if (pending.taskCount > 0) {
                        stringResource(
                            Res.string.settings_delete_category_with_tasks,
                            pending.name,
                            pending.taskCount,
                        )
                    } else {
                        stringResource(Res.string.settings_delete_category_message, pending.name)
                    }
                AlertDialog(
                    onDismissRequest = { vm.dismissCategoryDelete() },
                    title = { Text(stringResource(Res.string.settings_delete_category_title)) },
                    text = { Text(msg) },
                    confirmButton = {
                        Button(onClick = { vm.confirmCategoryDelete() }) {
                            Text(stringResource(Res.string.settings_delete))
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { vm.dismissCategoryDelete() }) {
                            Text(stringResource(Res.string.cancel))
                        }
                    },
                )
            }
        }
    }
}

/** Platform hooks for import/export (Android: Storage Access Framework + share sheet). */
public interface FileBridge {
    public fun shareSqlite(
        bytes: ByteArray,
        filename: String,
    )

    public fun launchImport(onResult: (ByteArray?) -> Unit)
}
