package com.bluetasks.mobile.ui.theme

import androidx.compose.ui.graphics.Color
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * Locks design tokens to the web CSS palette ([web/app/src/index.css](web/app/src/index.css)).
 */
class BlueTasksColorsTest {
    @Test
    fun canvas_matches_web_canvas_token() {
        assertEquals(Color(0xFF2A2634), BlueTasksColors.Canvas)
    }

    @Test
    fun accent_matches_web_accent_token() {
        assertEquals(Color(0xFF7EB8FF), BlueTasksColors.Accent)
    }
}
