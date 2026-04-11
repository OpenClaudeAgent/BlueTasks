package com.bluetasks.mobile.shared.settings

import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_ALL
import com.bluetasks.mobile.shared.domain.SECTION_TODAY
import com.russhwolf.settings.Settings

public class BlueTasksSettings(
    private val settings: Settings,
) {
    public var apiBaseUrl: String
        get() = settings.getString(KEY_BASE_URL, "")
        set(value) {
            settings.putString(KEY_BASE_URL, value.trim())
        }

    /** Last-selected board section filter (`today`, `upcoming`, `done`, …). */
    public var boardSection: String
        get() = settings.getString(KEY_BOARD_SECTION, SECTION_TODAY)
        set(value) {
            settings.putString(KEY_BOARD_SECTION, value)
        }

    /** Category filter: `all`, `uncategorized`, or a category id. */
    public var boardCategoryFilter: String
        get() = settings.getString(KEY_BOARD_CATEGORY_FILTER, FILTER_CATEGORY_ALL)
        set(value) {
            settings.putString(KEY_BOARD_CATEGORY_FILTER, value)
        }

    private companion object {
        const val KEY_BASE_URL = "api_base_url"
        const val KEY_BOARD_SECTION = "board_section"
        const val KEY_BOARD_CATEGORY_FILTER = "board_category_filter"
    }
}

public fun createBlueTasksSettings(): BlueTasksSettings = BlueTasksSettings(Settings())
