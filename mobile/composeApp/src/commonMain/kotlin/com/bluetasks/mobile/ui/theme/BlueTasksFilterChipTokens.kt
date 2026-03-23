package com.bluetasks.mobile.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Shape

/** Shared FilterChip look for board filters and task editor (aligned with web chips). */
public object BlueTasksFilterChipTokens {
    public val shape: Shape = RoundedCornerShape(percent = 50)

    @Composable
    public fun colors() =
        FilterChipDefaults.filterChipColors(
            containerColor = BlueTasksColors.ChipBg,
            labelColor = MaterialTheme.colorScheme.onSurfaceVariant,
            selectedContainerColor = BlueTasksColors.AccentSoft,
            selectedLabelColor = MaterialTheme.colorScheme.primary,
            iconColor = MaterialTheme.colorScheme.onSurfaceVariant,
            selectedLeadingIconColor = MaterialTheme.colorScheme.primary,
        )

    @Composable
    public fun border(selected: Boolean) =
        FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = BlueTasksColors.BorderStrong,
            selectedBorderColor = BlueTasksColors.Accent,
        )
}
