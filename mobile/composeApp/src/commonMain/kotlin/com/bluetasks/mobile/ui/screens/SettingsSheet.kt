package com.bluetasks.mobile.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.bluetasks.mobile.AppUiState
import com.bluetasks.mobile.BlueTasksAppViewModel
import com.bluetasks.mobile.SettingsTab
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.cancel
import com.bluetasks.mobile.generated.categories_tab
import com.bluetasks.mobile.generated.connect
import com.bluetasks.mobile.generated.general_tab
import com.bluetasks.mobile.generated.server_url_hint
import com.bluetasks.mobile.generated.settings_add_category
import com.bluetasks.mobile.generated.settings_category_icon
import com.bluetasks.mobile.generated.settings_category_tasks_count
import com.bluetasks.mobile.generated.settings_data_intro
import com.bluetasks.mobile.generated.settings_delete
import com.bluetasks.mobile.generated.settings_new_category
import com.bluetasks.mobile.generated.settings_rename
import com.bluetasks.mobile.generated.settings_save
import com.bluetasks.mobile.shared.domain.CATEGORY_ICON_IDS
import com.bluetasks.mobile.ui.components.categoryIconVector
import com.bluetasks.mobile.ui.theme.BlueTasksColors
import com.bluetasks.mobile.ui.theme.BlueTasksFilterChipTokens
import com.composables.icons.lucide.FolderOpen
import com.composables.icons.lucide.Globe
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Pencil
import com.composables.icons.lucide.Plus
import com.composables.icons.lucide.Trash2
import org.jetbrains.compose.resources.stringResource

private val SettingsRowShape = RoundedCornerShape(10.dp)
private val CategoryIconSlot = 36.dp
private val CategoryRowIcon = 20.dp
private val SettingsChipIcon = 18.dp
private val SettingsRowBg = Color(0x08FFFFFF)
private val CategoryIconPickerCell = 34.dp
private val CategoryIconPickerGlyph = 18.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun SettingsSheet(
    state: AppUiState,
    vm: BlueTasksAppViewModel,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var editingId by remember { mutableStateOf<String?>(null) }
    var editName by remember { mutableStateOf("") }
    var editIcon by remember { mutableStateOf("folder") }
    val sheetScrollState = rememberScrollState()

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
                .verticalScroll(sheetScrollState)
                .padding(16.dp),
        ) {
            SettingsTabChips(
                selected = state.settingsTab,
                onSelect = vm::setSettingsTab,
                generalLabel = stringResource(Res.string.general_tab),
                categoriesLabel = stringResource(Res.string.categories_tab),
            )
            Spacer(Modifier.height(16.dp))
            when (state.settingsTab) {
                SettingsTab.General -> {
                    Text(
                        stringResource(Res.string.settings_data_intro),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
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
                }
                SettingsTab.Categories -> {
                    Text(
                        stringResource(Res.string.settings_category_icon),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 6.dp),
                    )
                    SettingsCategoryIconStrip(
                        selectedIconId = state.newCategoryIcon,
                        onSelectIcon = vm::updateNewCategoryIcon,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.newCategoryName,
                        onValueChange = vm::updateNewCategoryName,
                        label = { Text(stringResource(Res.string.settings_new_category)) },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    SettingsFullWidthIconButton(
                        onClick = { vm.addCategory() },
                        icon = { Icon(Lucide.Plus, contentDescription = null, modifier = Modifier.size(SettingsChipIcon)) },
                        label = { Text(stringResource(Res.string.settings_add_category)) },
                    )
                    Spacer(Modifier.height(16.dp))
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        state.categories.forEach { c ->
                            val taskCount = state.tasks.count { it.categoryId == c.id }
                            if (editingId == c.id) {
                                SettingsCategoryEditCard(
                                    editName = editName,
                                    onEditNameChange = { editName = it },
                                    editIcon = editIcon,
                                    onSelectEditIcon = { editIcon = it },
                                    onCancel = { editingId = null },
                                    onSave = {
                                        vm.updateCategory(c.id, editName, editIcon)
                                        editingId = null
                                    },
                                )
                            } else {
                                SettingsCategoryListRow(
                                    categoryIconId = c.icon,
                                    name = c.name,
                                    taskCountText = stringResource(Res.string.settings_category_tasks_count, taskCount),
                                    onEdit = {
                                        editingId = c.id
                                        editName = c.name
                                        editIcon = c.icon
                                    },
                                    onDelete = { vm.requestCategoryDelete(c.id) },
                                    renameContentDescription = stringResource(Res.string.settings_rename),
                                    deleteContentDescription = stringResource(Res.string.settings_delete),
                                )
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SettingsTabChips(
    selected: SettingsTab,
    onSelect: (SettingsTab) -> Unit,
    generalLabel: String,
    categoriesLabel: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        FilterChip(
            selected = selected == SettingsTab.General,
            onClick = { onSelect(SettingsTab.General) },
            label = { Text(generalLabel, style = MaterialTheme.typography.labelLarge) },
            leadingIcon = {
                Icon(
                    Lucide.Globe,
                    contentDescription = null,
                    modifier = Modifier.size(SettingsChipIcon),
                )
            },
            shape = BlueTasksFilterChipTokens.shape,
            colors = BlueTasksFilterChipTokens.colors(),
            border = BlueTasksFilterChipTokens.border(selected = selected == SettingsTab.General),
        )
        FilterChip(
            selected = selected == SettingsTab.Categories,
            onClick = { onSelect(SettingsTab.Categories) },
            label = { Text(categoriesLabel, style = MaterialTheme.typography.labelLarge) },
            leadingIcon = {
                Icon(
                    Lucide.FolderOpen,
                    contentDescription = null,
                    modifier = Modifier.size(SettingsChipIcon),
                )
            },
            shape = BlueTasksFilterChipTokens.shape,
            colors = BlueTasksFilterChipTokens.colors(),
            border = BlueTasksFilterChipTokens.border(selected = selected == SettingsTab.Categories),
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SettingsCategoryIconStrip(
    selectedIconId: String,
    onSelectIcon: (String) -> Unit,
) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        CATEGORY_ICON_IDS.forEach { id ->
            SettingsCategoryIconCell(
                id = id,
                selected = id == selectedIconId,
                onClick = { onSelectIcon(id) },
            )
        }
    }
}

@Composable
private fun SettingsCategoryIconCell(
    id: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    Surface(
        modifier =
            Modifier
                .size(CategoryIconPickerCell)
                .semantics {
                    role = Role.Button
                    contentDescription = id
                }
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    onClick = onClick,
                ),
        shape = RoundedCornerShape(9.dp),
        color =
            if (selected) {
                BlueTasksColors.AccentSoft
            } else {
                Color.Black.copy(alpha = 0.22f)
            },
        border =
            BorderStroke(
                1.dp,
                if (selected) {
                    BlueTasksColors.Accent.copy(alpha = 0.45f)
                } else {
                    BlueTasksColors.BorderStrong
                },
            ),
        shadowElevation = 0.dp,
        tonalElevation = 0.dp,
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Icon(
                categoryIconVector(id),
                contentDescription = null,
                modifier = Modifier.size(CategoryIconPickerGlyph),
                tint =
                    if (selected) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
            )
        }
    }
}

@Composable
private fun SettingsCategoryListRow(
    categoryIconId: String,
    name: String,
    taskCountText: String,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    renameContentDescription: String,
    deleteContentDescription: String,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = SettingsRowShape,
        colors = CardDefaults.cardColors(containerColor = SettingsRowBg),
        border = BorderStroke(1.dp, BlueTasksColors.BorderSubtle),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                Modifier.width(CategoryIconSlot),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    categoryIconVector(categoryIconId),
                    contentDescription = null,
                    modifier = Modifier.size(CategoryRowIcon),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Column(Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.bodyLarge)
                Text(
                    taskCountText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onEdit) {
                    Icon(
                        Lucide.Pencil,
                        contentDescription = renameContentDescription,
                        modifier = Modifier.size(SettingsChipIcon),
                    )
                }
                IconButton(onClick = onDelete) {
                    Icon(
                        Lucide.Trash2,
                        contentDescription = deleteContentDescription,
                        modifier = Modifier.size(SettingsChipIcon),
                        tint = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingsCategoryEditCard(
    editName: String,
    onEditNameChange: (String) -> Unit,
    editIcon: String,
    onSelectEditIcon: (String) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = SettingsRowShape,
        colors = CardDefaults.cardColors(containerColor = SettingsRowBg),
        border = BorderStroke(1.dp, BlueTasksColors.BorderSubtle),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                stringResource(Res.string.settings_category_icon),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 6.dp),
            )
            SettingsCategoryIconStrip(
                selectedIconId = editIcon,
                onSelectIcon = onSelectEditIcon,
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = editName,
                onValueChange = onEditNameChange,
                label = { Text(stringResource(Res.string.settings_new_category)) },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End),
            ) {
                TextButton(onClick = onCancel) {
                    Text(stringResource(Res.string.cancel))
                }
                Button(onClick = onSave) {
                    Text(stringResource(Res.string.settings_save))
                }
            }
        }
    }
}

@Composable
private fun SettingsFullWidthIconButton(
    onClick: () -> Unit,
    icon: @Composable () -> Unit,
    label: @Composable () -> Unit,
) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            icon()
            Spacer(Modifier.width(8.dp))
            label()
        }
    }
}
