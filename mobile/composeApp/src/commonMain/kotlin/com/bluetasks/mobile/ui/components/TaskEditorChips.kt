package com.bluetasks.mobile.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SelectableChipColors
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import com.bluetasks.mobile.ui.theme.BlueTasksFilterChipTokens

/**
 * Shared [FilterChip] styling for the task editor (priority, dates, pin, timer, etc.) —
 * same shape, border, and typography as the existing chip rows.
 */
@Composable
public fun TaskEditorFilterChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    shape: Shape = BlueTasksFilterChipTokens.shape,
    colors: SelectableChipColors = BlueTasksFilterChipTokens.colors(),
    border: BorderStroke = BlueTasksFilterChipTokens.border(selected = selected),
    leadingIcon: (@Composable () -> Unit)? = null,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = MaterialTheme.typography.labelMedium) },
        modifier = modifier,
        shape = shape,
        colors = colors,
        border = border,
        leadingIcon = leadingIcon,
    )
}

/** Primary-filled chip colors for the stopped timer (start) state; same size as other chips. */
@Composable
public fun TaskEditorTimerStartChipColors(): SelectableChipColors =
    FilterChipDefaults.filterChipColors(
        containerColor = MaterialTheme.colorScheme.primary,
        labelColor = MaterialTheme.colorScheme.onPrimary,
        iconColor = MaterialTheme.colorScheme.onPrimary,
        selectedContainerColor = MaterialTheme.colorScheme.primary,
        selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
        selectedLeadingIconColor = MaterialTheme.colorScheme.onPrimary,
        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
        disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
        disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
    )
