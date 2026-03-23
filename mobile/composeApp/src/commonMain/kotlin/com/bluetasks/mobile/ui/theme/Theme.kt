package com.bluetasks.mobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

/**
 * BlueTasks UI: always use the web-matched dark palette (the web app is dark-only in `:root`).
 */
@Composable
public fun BlueTasksTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = BlueTasksColors.DarkScheme,
        shapes = BlueTasksShapes,
        content = content,
    )
}
