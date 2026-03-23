package com.bluetasks.mobile.shared.lexical

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull

class LexicalNativePayloadTest {
    @Test
    fun parseReady() {
        assertEquals(LexicalNativePayload.Ready, LexicalNativePayload.parse("""{"type":"ready"}"""))
    }

    @Test
    fun parseChange() {
        val p = LexicalNativePayload.parse("""{"type":"change","json":"{}","plainText":"hi","checklistTotal":2,"checklistCompleted":1}""")
        val change = assertIs<LexicalNativePayload.Change>(p)
        assertEquals("{}", change.json)
        assertEquals("hi", change.plainText)
        assertEquals(2, change.checklistTotal)
        assertEquals(1, change.checklistCompleted)
    }

    @Test
    fun parseChangeRejectsMissingJson() {
        assertNull(LexicalNativePayload.parse("""{"type":"change","plainText":""}"""))
    }

    @Test
    fun parseInvalid() {
        assertNull(LexicalNativePayload.parse("not json"))
    }

    @Test
    fun parseUnknownType() {
        assertNull(LexicalNativePayload.parse("""{"type":"ping"}"""))
    }

    @Test
    fun parseChangeAllowsEmptyPlainTextWhenJsonPresent() {
        val p =
            LexicalNativePayload.parse(
                """{"type":"change","json":"{}","plainText":"","checklistTotal":0,"checklistCompleted":0}""",
            )
        val change = assertIs<LexicalNativePayload.Change>(p)
        assertEquals("{}", change.json)
        assertEquals("", change.plainText)
    }
}
