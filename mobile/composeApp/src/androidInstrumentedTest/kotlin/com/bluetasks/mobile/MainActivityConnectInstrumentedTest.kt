package com.bluetasks.mobile

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import java.io.File

/** Instrumented UI tests: [ConnectScreen] content and [BlueTasksAppViewModel] empty-URL validation. */
@RunWith(AndroidJUnit4::class)
class MainActivityConnectInstrumentedTest {
    private val composeRule = createAndroidComposeRule<MainActivity>()

    @get:Rule
    val chain: TestRule =
        RuleChain.outerRule(ClearAndroidSharedPrefsRule()).around(composeRule)

    @Test
    fun connect_screen_shows_branding_url_field_and_connect_action() {
        composeRule.waitForIdle()
        composeRule.onNodeWithText("BlueTasks").assertIsDisplayed()
        composeRule
            .onNodeWithText("Server URL (http://host:8787)", substring = false, ignoreCase = false)
            .assertExists()
        composeRule.onNodeWithText("Connect").assertIsDisplayed()
    }

    @Test
    fun connect_with_empty_url_shows_validation_error() {
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Connect").performClick()
        composeRule.waitForIdle()
        composeRule
            .onNodeWithText("Enter server URL", substring = true, ignoreCase = false)
            .assertExists()
    }

    /** Ensures a cold start so [ConnectScreen] is shown (no persisted base URL). */
    private class ClearAndroidSharedPrefsRule : TestRule {
        override fun apply(
            base: Statement,
            description: Description,
        ): Statement {
            return object : Statement() {
                override fun evaluate() {
                    val ctx = InstrumentationRegistry.getInstrumentation().targetContext
                    val prefsDir = File(ctx.applicationInfo.dataDir, "shared_prefs")
                    prefsDir.listFiles()?.forEach { file ->
                        if (file.isFile) {
                            file.delete()
                        }
                    }
                    base.evaluate()
                }
            }
        }
    }
}
