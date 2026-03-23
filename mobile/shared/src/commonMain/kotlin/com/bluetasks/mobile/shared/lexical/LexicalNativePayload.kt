package com.bluetasks.mobile.shared.lexical

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

private val bridgeJson = Json { ignoreUnknownKeys = true }

public sealed class LexicalNativePayload {
    public data object Ready : LexicalNativePayload()

    public data class Change(
        public val json: String,
        public val plainText: String,
        public val checklistTotal: Int,
        public val checklistCompleted: Int,
    ) : LexicalNativePayload()

    public companion object {
        public fun parse(raw: String): LexicalNativePayload? {
            return try {
                val o = bridgeJson.parseToJsonElement(raw).jsonObject
                when (o["type"]?.jsonPrimitive?.content) {
                    "ready" -> Ready
                    "change" -> {
                        val json = o["json"]?.jsonPrimitive?.content ?: return null
                        Change(
                            json = json,
                            plainText = o["plainText"]?.jsonPrimitive?.content ?: "",
                            checklistTotal = o["checklistTotal"]?.jsonPrimitive?.intOrNull ?: 0,
                            checklistCompleted = o["checklistCompleted"]?.jsonPrimitive?.intOrNull ?: 0,
                        )
                    }
                    else -> null
                }
            } catch (_: Exception) {
                null
            }
        }
    }
}
