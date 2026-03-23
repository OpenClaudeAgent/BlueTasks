package com.bluetasks.mobile.shared.lexical

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class LexicalWebViewBridgeTest {
    @Test
    fun setDocumentScriptContainsJsonPayloadAndCall() {
        val js = lexicalEvaluateSetDocumentScript("{}", "Ph")
        assertTrue(js.startsWith("window.__BT_LEXICAL_RECEIVE__("))
        assertTrue(js.contains("setDocument") && js.contains("contentJson") && js.contains("placeholder"))
        assertTrue(js.contains("{}") && js.contains("Ph"))
    }

    @Test
    fun setDocumentScriptEscapesQuotesAndNewlinesInPlaceholder() {
        val js = lexicalEvaluateSetDocumentScript("{}", "a\"b\nc")
        assertTrue(js.contains("\\\""))
        assertTrue(js.contains("\\n"))
    }

    @Test
    fun dispatchReady() {
        var ready = false
        dispatchLexicalBridgePayload(
            LexicalNativePayload.Ready,
            onEditorReady = { ready = true },
            onDocumentChange = { _, _, _, _ -> error("no change") },
        )
        assertTrue(ready)
    }

    @Test
    fun dispatchChange() {
        var json = ""
        val raw = """{"type":"change","json":"{\"k\":true}","plainText":"","checklistTotal":0,"checklistCompleted":0}"""
        dispatchLexicalBridgePayload(
            LexicalNativePayload.parse(raw),
            onEditorReady = { error("no ready") },
            onDocumentChange = { j, _, _, _ -> json = j },
        )
        assertEquals("""{"k":true}""", json)
    }

    @Test
    fun dispatchIgnoresChangeWithEmptyJsonString() {
        var calls = 0
        dispatchLexicalBridgePayload(
            LexicalNativePayload.Change(json = "", plainText = "x", checklistTotal = 0, checklistCompleted = 0),
            onEditorReady = {},
            onDocumentChange = { _, _, _, _ -> calls++ },
        )
        assertEquals(0, calls)
    }
}
