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

    /** BCP-47 tags aligned with web app locales (client-only UI language). */
    public var uiLanguageTag: String
        get() = settings.getString(KEY_UI_LANG, "en")
        set(value) {
            settings.putString(KEY_UI_LANG, value)
        }

    private companion object {
        const val KEY_BASE_URL = "api_base_url"
        const val KEY_UI_LANG = "ui_language"
    }
}

public fun createBlueTasksSettings(): BlueTasksSettings = BlueTasksSettings(Settings())
