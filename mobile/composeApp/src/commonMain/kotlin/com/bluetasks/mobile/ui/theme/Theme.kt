package com.bluetasks.mobile.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors =
    lightColorScheme(
        primary = Color(0xFF2563EB),
        onPrimary = Color.White,
        primaryContainer = Color(0xFFDBEAFE),
        secondary = Color(0xFF475569),
        background = Color(0xFFF8FAFC),
        surface = Color.White,
    )

private val DarkColors =
    darkColorScheme(
        primary = Color(0xFF93C5FD),
        onPrimary = Color(0xFF0F172A),
        primaryContainer = Color(0xFF1E3A5F),
        secondary = Color(0xFF94A3B8),
        background = Color(0xFF0F172A),
        surface = Color(0xFF1E293B),
    )

@Composable
public fun BlueTasksTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val colors: ColorScheme = if (dark) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        content = content,
    )
}
