package com.bluetasks.mobile.shared.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class EstimatePresetsTest {
    @Test
    fun presets_match_web_constants() {
        assertEquals(listOf(30, 60, 120, 240, 1440), ESTIMATE_PRESET_MINUTES)
    }
}
