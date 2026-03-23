package com.bluetasks.mobile.shared.http

import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.ContentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

public expect fun createPlatformHttpClient(block: HttpClientConfig<*>.() -> Unit = {}): HttpClient

public fun createBlueTasksHttpClient(
    baseUrl: String,
    json: Json = BlueTasksJson,
    debugLogging: Boolean = false,
): HttpClient {
    val normalized = baseUrl.trimEnd('/')
    return createPlatformHttpClient {
        expectSuccess = false
        install(ContentNegotiation) {
            // Explicit content type so request/response JSON is registered without relying on reflection
            // (needed on Kotlin/Native — see Ktor “Kotlin reflection is not available” for typed setBody).
            json(json, contentType = ContentType.Application.Json)
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 60_000
            connectTimeoutMillis = 30_000
        }
        if (debugLogging) {
            install(Logging) {
                logger =
                    object : Logger {
                        override fun log(message: String) {
                            println(message)
                        }
                    }
                level = LogLevel.INFO
            }
        }
        defaultRequest {
            url(normalized)
        }
    }
}

public val BlueTasksJson: Json =
    Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
