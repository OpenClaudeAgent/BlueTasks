package com.bluetasks.mobile.shared.settings

import com.russhwolf.settings.Settings

public class BlueTasksSettings(
    private val settings: Settings,
) {
    public var apiBaseUrl: String
        get() = settings.getString(KEY_BASE_URL, "")
        set(value) {
            settings.putString(KEY_BASE_URL, value.trim())
        }

    private companion object {
        const val KEY_BASE_URL = "api_base_url"
    }
}

public fun createBlueTasksSettings(): BlueTasksSettings = BlueTasksSettings(Settings())
