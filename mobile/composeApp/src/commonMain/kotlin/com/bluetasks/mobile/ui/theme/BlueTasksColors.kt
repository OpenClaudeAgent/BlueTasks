package com.bluetasks.mobile.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

/**
 * Design tokens aligned with [web/app/src/index.css](web/app/src/index.css) (`:root` dark theme).
 */
@Suppress("MagicNumber")
public object BlueTasksColors {
    /** `--canvas` */
    public val Canvas: Color = Color(0xFF2A2634)

    /** `--canvas-elevated` */
    public val CanvasElevated: Color = Color(0xFF323042)

    /** `--sidebar-bg` */
    public val SidebarBg: Color = Color(0xFF24202E)

    /** `--card` */
    public val Card: Color = Color(0xFF353044)

    /** `--accent` */
    public val Accent: Color = Color(0xFF7EB8FF)

    /** `--date-pill-today-text` (on accent chips) */
    public val OnAccentStrong: Color = Color(0xFF0D1520)

    /** `--text` ~94% white */
    public val TextPrimary: Color = Color(0xFFF0EEF5)

    /** `--text-secondary` ~62% */
    public val TextSecondary: Color = Color(0xFF9E9CAD)

    /** `--text-muted` ~38% */
    public val TextMuted: Color = Color(0xFF6B6978)

    /** `--danger` */
    public val Danger: Color = Color(0xFFFF7A7A)

    /** `--accent-soft` rgba(126,184,255,0.12) */
    public val AccentSoft: Color = Color(0x1F7EB8FF)

    /** `--border` rgba(255,255,255,0.055) */
    public val BorderSubtle: Color = Color(0x0EFFFFFF)

    /** `--border-strong` rgba(255,255,255,0.09) */
    public val BorderStrong: Color = Color(0x17FFFFFF)

    /** `--chip-bg` rgba(255,255,255,0.06) */
    public val ChipBg: Color = Color(0x0FFFFFFF)

    /** Material [darkColorScheme] mapped from the above. */
    public val DarkScheme =
        darkColorScheme(
            primary = Accent,
            onPrimary = OnAccentStrong,
            primaryContainer = AccentSoft,
            onPrimaryContainer = Accent,
            secondary = TextSecondary,
            onSecondary = Canvas,
            secondaryContainer = Card,
            onSecondaryContainer = TextPrimary,
            tertiary = TextMuted,
            onTertiary = TextPrimary,
            background = Canvas,
            onBackground = TextPrimary,
            surface = Card,
            onSurface = TextPrimary,
            surfaceVariant = CanvasElevated,
            onSurfaceVariant = TextSecondary,
            surfaceTint = Accent,
            inverseSurface = TextPrimary,
            inverseOnSurface = Canvas,
            error = Danger,
            onError = Color.White,
            outline = BorderStrong,
            outlineVariant = BorderSubtle,
        )
}
