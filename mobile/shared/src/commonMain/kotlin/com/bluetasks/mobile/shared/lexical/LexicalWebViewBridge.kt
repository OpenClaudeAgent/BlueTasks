package com.bluetasks.mobile.shared.lexical

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val setDocumentJson = Json { encodeDefaults = true }

@Serializable
private data class SetDocumentMessage(
    val type: String = "setDocument",
    val contentJson: String,
    val placeholder: String,
)

/**
 * Full JS snippet for [android.webkit.WebView.evaluateJavascript] / WKWebView `evaluateJavaScript`.
 * Matches the web shell contract: `window.__BT_LEXICAL_RECEIVE__(payloadString)`.
 */
public fun lexicalEvaluateSetDocumentScript(
    contentJson: String,
    placeholder: String,
): String {
    val payload =
        setDocumentJson.encodeToString(
            SetDocumentMessage(contentJson = contentJson, placeholder = placeholder),
        )
    return "window.__BT_LEXICAL_RECEIVE__(${escapeJavaScriptStringLiteral(payload)})"
}

/**
 * Applies [LexicalNativePayload] from the WebView bridge (ready / change).
 */
public fun dispatchLexicalBridgePayload(
    parsed: LexicalNativePayload?,
    onEditorReady: () -> Unit,
    onDocumentChange: (
        contentJson: String,
        contentText: String,
        checklistTotal: Int,
        checklistCompleted: Int,
    ) -> Unit,
) {
    when (parsed) {
        LexicalNativePayload.Ready -> onEditorReady()
        is LexicalNativePayload.Change ->
            if (parsed.json.isNotEmpty()) {
                onDocumentChange(parsed.json, parsed.plainText, parsed.checklistTotal, parsed.checklistCompleted)
            }
        null -> Unit
    }
}

private fun escapeJavaScriptStringLiteral(s: String): String =
    buildString(s.length + 8) {
        append('"')
        for (ch in s) {
            when (ch) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else ->
                    if (ch.code < 0x20) {
                        append("\\u")
                        append(ch.code.toString(16).padStart(4, '0'))
                    } else {
                        append(ch)
                    }
            }
        }
        append('"')
    }
