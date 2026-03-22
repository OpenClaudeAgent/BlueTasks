package com.bluetasks.mobile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluetasks.mobile.shared.api.ApiCategoryRow
import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.CreateCategoryBody
import com.bluetasks.mobile.shared.api.TaskStatus
import com.bluetasks.mobile.shared.api.UpdateCategoryBody
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_ALL
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_UNCATEGORIZED
import com.bluetasks.mobile.shared.domain.SECTION_ALL
import com.bluetasks.mobile.shared.domain.SECTION_ANYTIME
import com.bluetasks.mobile.shared.domain.SECTION_DONE
import com.bluetasks.mobile.shared.domain.SECTION_TODAY
import com.bluetasks.mobile.shared.domain.SECTION_UPCOMING
import com.bluetasks.mobile.shared.domain.filterTasks
import com.bluetasks.mobile.shared.domain.getTaskCounts
import com.bluetasks.mobile.shared.domain.newTaskDraft
import com.bluetasks.mobile.shared.domain.toWritePayload
import com.bluetasks.mobile.shared.session.BlueTasksSession
import com.bluetasks.mobile.shared.session.openBlueTasksSession
import com.bluetasks.mobile.shared.settings.BlueTasksSettings
import com.bluetasks.mobile.shared.settings.createBlueTasksSettings
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

public enum class SettingsTab {
    General,
    Categories,
}

public data class AppUiState(
    val baseUrlDraft: String = "",
    val savedBaseUrl: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val tasks: List<ApiTaskRow> = emptyList(),
    val categories: List<ApiCategoryRow> = emptyList(),
    val section: String = SECTION_TODAY,
    val categoryFilter: String = FILTER_CATEGORY_ALL,
    val selectedTaskId: String? = null,
    val quickCaptureText: String = "",
    val settingsOpen: Boolean = false,
    val settingsTab: SettingsTab = SettingsTab.General,
    val newCategoryName: String = "",
    val newCategoryIcon: String = "folder",
    val importExportBanner: String? = null,
    val confirmImportPending: Boolean = false,
    val confirmReplaceServerDb: ByteArray? = null,
) {
    val visibleTasks: List<ApiTaskRow>
        get() = filterTasks(tasks, section, categoryFilter)

    val counts
        get() = getTaskCounts(tasks, categoryFilter)

    val selectedTask: ApiTaskRow?
        get() = selectedTaskId?.let { id -> tasks.find { it.id == id } }
}

public class BlueTasksAppViewModel(
    private val settings: BlueTasksSettings = createBlueTasksSettings(),
) : ViewModel() {
    private val _state = MutableStateFlow(AppUiState())
    public val state: StateFlow<AppUiState> = _state.asStateFlow()

    private val _effects = Channel<AppEffect>(capacity = Channel.BUFFERED)
    public val effects = _effects.receiveAsFlow()

    private var session: BlueTasksSession? = null
    private var saveJob: Job? = null
    private var saveGeneration: Long = 0

    init {
        val url = settings.apiBaseUrl
        _state.value =
            AppUiState(
                baseUrlDraft = url,
                savedBaseUrl = url,
            )
        if (url.isNotBlank()) {
            viewModelScope.launch { connectInternal(url) }
        }
    }

    public fun updateBaseUrlDraft(value: String) {
        _state.value = _state.value.copy(baseUrlDraft = value, error = null)
    }

    public fun connect() {
        val url = _state.value.baseUrlDraft.trim()
        viewModelScope.launch { connectInternal(url) }
    }

    private suspend fun connectInternal(url: String) {
        if (url.isBlank()) {
            _state.value = _state.value.copy(error = "Enter server URL (e.g. http://192.168.1.10:8787)")
            return
        }
        session?.close()
        session = null
        _state.value = _state.value.copy(loading = true, error = null)
        val newSession = openBlueTasksSession(url)
        if (newSession == null) {
            _state.value = _state.value.copy(loading = false, error = "Invalid URL")
            return
        }
        session = newSession
        settings.apiBaseUrl = url
        newSession.api.getTasks().fold(
            onSuccess = { list ->
                newSession.api.getCategories().fold(
                    onSuccess = { cats ->
                        _state.value =
                            _state.value.copy(
                                loading = false,
                                tasks = list,
                                categories = cats.sortedBy { it.sortIndex },
                                savedBaseUrl = url,
                                error = null,
                            )
                    },
                    onFailure = { e ->
                        _state.value = _state.value.copy(loading = false, error = e.message ?: "Categories failed")
                    },
                )
            },
            onFailure = { e ->
                session?.close()
                session = null
                _state.value = _state.value.copy(loading = false, error = e.message ?: "Cannot reach server")
            },
        )
    }

    public fun refresh() {
        val s = session ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            s.api.getTasks().fold(
                onSuccess = { list ->
                    s.api.getCategories().fold(
                        onSuccess = { cats ->
                            _state.value =
                                _state.value.copy(
                                    loading = false,
                                    tasks = list,
                                    categories = cats.sortedBy { it.sortIndex },
                                )
                        },
                        onFailure = { e ->
                            _state.value = _state.value.copy(loading = false, error = e.message)
                        },
                    )
                },
                onFailure = { e ->
                    _state.value = _state.value.copy(loading = false, error = e.message)
                },
            )
        }
    }

    public fun setSection(section: String) {
        _state.value = _state.value.copy(section = section)
    }

    public fun setCategoryFilter(filter: String) {
        _state.value = _state.value.copy(categoryFilter = filter)
    }

    public fun openSettings(open: Boolean) {
        _state.value = _state.value.copy(settingsOpen = open, importExportBanner = null)
    }

    public fun setSettingsTab(tab: SettingsTab) {
        _state.value = _state.value.copy(settingsTab = tab)
    }

    public fun updateQuickCapture(text: String) {
        _state.value = _state.value.copy(quickCaptureText = text)
    }

    public fun submitQuickCapture() {
        val s = session ?: return
        val title = _state.value.quickCaptureText.trim()
        if (title.isEmpty()) return
        val cat =
            when (val f = _state.value.categoryFilter) {
                FILTER_CATEGORY_ALL -> null
                FILTER_CATEGORY_UNCATEGORIZED -> null
                else -> f
            }
        val draft = newTaskDraft(title, cat)
        viewModelScope.launch {
            s.api.createTask(toWritePayload(draft)).fold(
                onSuccess = { created ->
                    _state.value =
                        _state.value.copy(
                            tasks = _state.value.tasks + created,
                            quickCaptureText = "",
                            selectedTaskId = created.id,
                        )
                },
                onFailure = { e ->
                    _state.value = _state.value.copy(error = e.message)
                },
            )
        }
    }

    public fun selectTask(id: String?) {
        _state.value = _state.value.copy(selectedTaskId = id)
    }

    public fun scheduleTaskSave(updated: ApiTaskRow) {
        val s = session ?: return
        val myGen = ++saveGeneration
        saveJob?.cancel()
        saveJob =
            viewModelScope.launch {
                delay(450)
                if (myGen != saveGeneration) return@launch
                s.api.updateTask(updated.id, toWritePayload(updated)).fold(
                    onSuccess = { saved ->
                        _state.value =
                            _state.value.copy(
                                tasks = _state.value.tasks.map { if (it.id == saved.id) saved else it },
                            )
                    },
                    onFailure = { e ->
                        _state.value = _state.value.copy(error = e.message)
                    },
                )
            }
    }

    public fun deleteTask(id: String) {
        val s = session ?: return
        viewModelScope.launch {
            s.api.deleteTask(id).fold(
                onSuccess = {
                    _state.value =
                        _state.value.copy(
                            tasks = _state.value.tasks.filter { it.id != id },
                            selectedTaskId = if (_state.value.selectedTaskId == id) null else _state.value.selectedTaskId,
                        )
                },
                onFailure = { e -> _state.value = _state.value.copy(error = e.message) },
            )
        }
    }

    public fun updateNewCategoryName(value: String) {
        _state.value = _state.value.copy(newCategoryName = value)
    }

    public fun updateNewCategoryIcon(value: String) {
        _state.value = _state.value.copy(newCategoryIcon = value)
    }

    public fun addCategory() {
        val s = session ?: return
        val name = _state.value.newCategoryName.trim()
        if (name.isEmpty()) return
        viewModelScope.launch {
            s.api.createCategory(CreateCategoryBody(name = name, icon = _state.value.newCategoryIcon)).fold(
                onSuccess = { row ->
                    _state.value =
                        _state.value.copy(
                            categories = (_state.value.categories + row).sortedBy { it.sortIndex },
                            newCategoryName = "",
                        )
                },
                onFailure = { e -> _state.value = _state.value.copy(error = e.message) },
            )
        }
    }

    public fun deleteCategory(id: String) {
        val s = session ?: return
        viewModelScope.launch {
            s.api.deleteCategory(id).fold(
                onSuccess = {
                    _state.value =
                        _state.value.copy(
                            categories = _state.value.categories.filter { it.id != id },
                            tasks =
                                _state.value.tasks.map { t ->
                                    if (t.categoryId == id) t.copy(categoryId = null) else t
                                },
                        )
                },
                onFailure = { e -> _state.value = _state.value.copy(error = e.message) },
            )
        }
    }

    public fun requestExportDatabase() {
        val s = session ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            s.api.exportDatabase().fold(
                onSuccess = { bytes ->
                    val stamp = Clock.System.now().toString().take(10)
                    val name = "bluetasks-$stamp.sqlite"
                    _state.value = _state.value.copy(loading = false, importExportBanner = null)
                    _effects.send(AppEffect.ShareSqlite(bytes, name))
                },
                onFailure = { e ->
                    _state.value = _state.value.copy(loading = false, importExportBanner = e.message ?: "Export failed")
                },
            )
        }
    }

    public fun requestImportPicker() {
        viewModelScope.launch {
            _effects.send(AppEffect.LaunchImportPicker)
        }
    }

    public fun onImportFileSelected(bytes: ByteArray?) {
        if (bytes == null || bytes.isEmpty()) return
        _state.value =
            _state.value.copy(
                confirmImportPending = true,
                confirmReplaceServerDb = bytes,
                importExportBanner = "This replaces the server database. Continue?",
            )
    }

    public fun cancelImportConfirm() {
        _state.value =
            _state.value.copy(
                confirmImportPending = false,
                confirmReplaceServerDb = null,
                importExportBanner = null,
            )
    }

    public fun confirmImportReplace() {
        val s = session ?: return
        val payload = _state.value.confirmReplaceServerDb ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, confirmImportPending = false, importExportBanner = null)
            s.api.importDatabase(payload).fold(
                onSuccess = {
                    _state.value =
                        _state.value.copy(
                            loading = false,
                            confirmReplaceServerDb = null,
                            importExportBanner = "Import complete. Refreshing…",
                        )
                    refresh()
                },
                onFailure = { e ->
                    _state.value =
                        _state.value.copy(
                            loading = false,
                            confirmReplaceServerDb = null,
                            importExportBanner = e.message ?: "Import failed",
                        )
                },
            )
        }
    }

    public fun toggleTimer(task: ApiTaskRow) {
        val now = Clock.System.now()
        val nowStr = now.toString()
        val startedAt = task.timerStartedAt
        val updated =
            if (startedAt != null) {
                val start = Instant.parse(startedAt)
                val deltaSec = (now - start).inWholeSeconds.toInt().coerceAtLeast(0)
                task.copy(
                    timerStartedAt = null,
                    timeSpentSeconds = task.timeSpentSeconds + deltaSec,
                )
            } else {
                task.copy(timerStartedAt = nowStr)
            }
        _state.value =
            _state.value.copy(tasks = _state.value.tasks.map { if (it.id == updated.id) updated else it })
        scheduleTaskSave(updated)
    }

    public fun toggleTaskCompleted(task: ApiTaskRow) {
        val next =
            if (task.status == TaskStatus.completed) {
                task.copy(status = TaskStatus.pending)
            } else {
                task.copy(status = TaskStatus.completed)
            }
        _state.value = _state.value.copy(tasks = _state.value.tasks.map { if (it.id == next.id) next else it })
        scheduleTaskSave(next)
    }

    override fun onCleared() {
        super.onCleared()
        session?.close()
    }

    public companion object {
        public val sectionIds: List<String> =
            listOf(SECTION_TODAY, SECTION_UPCOMING, SECTION_ANYTIME, SECTION_DONE, SECTION_ALL)
    }
}
