package com.bluetasks.mobile.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.bluetasks.mobile.AppUiState
import com.bluetasks.mobile.BlueTasksAppViewModel
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.add_task
import com.bluetasks.mobile.generated.app_name
import com.bluetasks.mobile.generated.quick_capture_hint
import com.bluetasks.mobile.generated.section_all
import com.bluetasks.mobile.generated.section_anytime
import com.bluetasks.mobile.generated.section_done
import com.bluetasks.mobile.generated.section_nav_content_desc
import com.bluetasks.mobile.generated.section_today
import com.bluetasks.mobile.generated.section_upcoming
import com.bluetasks.mobile.generated.settings
import com.bluetasks.mobile.generated.settings_content_desc
import com.bluetasks.mobile.platform.isIosUi
import com.bluetasks.mobile.ui.components.CategoryChipsRow
import com.bluetasks.mobile.ui.components.TaskRowCard
import com.bluetasks.mobile.ui.components.sectionNavIcon
import com.bluetasks.mobile.ui.theme.BlueTasksColors
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Plus
import com.composables.icons.lucide.Settings
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import org.jetbrains.compose.resources.stringResource

/** Matches web `.mainHeader__quickCapture` / `.mainHeader__addBtn` row height and radius. */
private val QuickCaptureRowHeight = 52.dp
private val QuickCaptureRadius = 12.dp
private val QuickCaptureFieldBg = Color.Black.copy(alpha = 0.22f)
private val QuickCaptureFieldBorder = Color.White.copy(alpha = 0.08f)
private val QuickAddBg = Color(0xFF2D3343)
private val QuickAddBorder = Color.White.copy(alpha = 0.07f)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun MainBoardScreen(
    state: AppUiState,
    vm: BlueTasksAppViewModel,
    modifier: Modifier = Modifier,
) {
    val hasActiveTimer = state.visibleTasks.any { it.timerStartedAt != null }
    var now by remember { mutableStateOf(Clock.System.now()) }
    LaunchedEffect(hasActiveTimer) {
        if (!hasActiveTimer) return@LaunchedEffect
        while (true) {
            delay(1000)
            now = Clock.System.now()
        }
    }

    val iosChrome = isIosUi()
    val captureRadius = if (iosChrome) 10.dp else QuickCaptureRadius

    Scaffold(
        modifier = modifier,
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = {
            val settingsLabel = stringResource(Res.string.settings)
            val settingsCd = stringResource(Res.string.settings_content_desc)
            val barColors =
                TopAppBarDefaults.topAppBarColors(
                    containerColor = BlueTasksColors.CanvasElevated,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    actionIconContentColor = MaterialTheme.colorScheme.onBackground,
                )
            val actions: @Composable RowScope.() -> Unit = {
                IconButton(onClick = { vm.openSettings(true) }) {
                    Icon(Lucide.Settings, contentDescription = "$settingsCd: $settingsLabel")
                }
            }
            if (iosChrome) {
                Column {
                    CenterAlignedTopAppBar(
                        title = { Text(stringResource(Res.string.app_name)) },
                        actions = actions,
                        colors =
                            TopAppBarDefaults.centerAlignedTopAppBarColors(
                                containerColor = BlueTasksColors.CanvasElevated,
                                titleContentColor = MaterialTheme.colorScheme.onBackground,
                                actionIconContentColor = MaterialTheme.colorScheme.onBackground,
                            ),
                    )
                    HorizontalDivider(
                        thickness = 0.5.dp,
                        color = BlueTasksColors.BorderStrong,
                    )
                }
            } else {
                TopAppBar(
                    title = { Text(stringResource(Res.string.app_name)) },
                    actions = actions,
                    colors = barColors,
                )
            }
        },
        bottomBar = {
            if (iosChrome) {
                Column(Modifier.fillMaxWidth()) {
                    HorizontalDivider(
                        thickness = 0.5.dp,
                        color = BlueTasksColors.BorderStrong,
                    )
                    NavigationBar(
                        containerColor = BlueTasksColors.SidebarBg,
                        contentColor = MaterialTheme.colorScheme.onSurface,
                        tonalElevation = 0.dp,
                        windowInsets = NavigationBarDefaults.windowInsets,
                    ) {
                        BlueTasksSectionBarItems(state, vm, iosChrome)
                    }
                }
            } else {
                NavigationBar(
                    containerColor = BlueTasksColors.SidebarBg,
                    contentColor = MaterialTheme.colorScheme.onSurface,
                    windowInsets = NavigationBarDefaults.windowInsets,
                ) {
                    BlueTasksSectionBarItems(state, vm, iosChrome)
                }
            }
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            if (state.loading) {
                LinearProgressIndicator(
                    Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
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
                    .padding(start = 8.dp, end = 8.dp, top = 12.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = state.quickCaptureText,
                    onValueChange = vm::updateQuickCapture,
                    modifier = Modifier.weight(1f).height(QuickCaptureRowHeight),
                    shape = RoundedCornerShape(captureRadius),
                    placeholder = { Text(stringResource(Res.string.quick_capture_hint)) },
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyMedium,
                    colors =
                        OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f),
                            unfocusedBorderColor = QuickCaptureFieldBorder,
                            focusedTextColor = MaterialTheme.colorScheme.onSurface,
                            unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                            focusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unfocusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            focusedContainerColor = QuickCaptureFieldBg,
                            unfocusedContainerColor = QuickCaptureFieldBg,
                        ),
                )
                val addLabel = stringResource(Res.string.add_task)
                val quickAddShape = RoundedCornerShape(captureRadius)
                Surface(
                    modifier =
                        Modifier
                            .size(QuickCaptureRowHeight)
                            .clip(quickAddShape)
                            .clickable(
                                onClickLabel = addLabel,
                                onClick = { vm.submitQuickCapture() },
                            ),
                    shape = quickAddShape,
                    color = QuickAddBg,
                    border = BorderStroke(1.dp, QuickAddBorder),
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Icon(
                            Lucide.Plus,
                            contentDescription = addLabel,
                            modifier = Modifier.size(24.dp),
                            tint = BlueTasksColors.Accent,
                        )
                    }
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
                        now = now,
                        onOpen = { vm.selectTask(task.id) },
                        onToggleDone = { vm.toggleTaskCompleted(task) },
                    )
                }
            }
        }
    }
}

@Composable
private fun RowScope.BlueTasksSectionBarItems(
    state: AppUiState,
    vm: BlueTasksAppViewModel,
    iosChrome: Boolean,
) {
    val navDesc = stringResource(Res.string.section_nav_content_desc)
    BlueTasksAppViewModel.sectionIds.forEach { sid ->
        val label =
            when (sid) {
                "today" -> stringResource(Res.string.section_today)
                "upcoming" -> stringResource(Res.string.section_upcoming)
                "anytime" -> stringResource(Res.string.section_anytime)
                "done" -> stringResource(Res.string.section_done)
                else -> stringResource(Res.string.section_all)
            }
        NavigationBarItem(
            selected = state.section == sid,
            onClick = { vm.setSection(sid) },
            label = { Text(label, maxLines = 1) },
            icon = {
                Icon(
                    sectionNavIcon(sid),
                    contentDescription = "$navDesc: $label",
                )
            },
            colors =
                NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor =
                        if (iosChrome) {
                            Color.Transparent
                        } else {
                            MaterialTheme.colorScheme.primaryContainer
                        },
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                ),
        )
    }
}
