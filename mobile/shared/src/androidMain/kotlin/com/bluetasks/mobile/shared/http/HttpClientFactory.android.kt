package com.bluetasks.mobile.shared.http

import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.okhttp.OkHttp

public actual fun createPlatformHttpClient(block: HttpClientConfig<*>.() -> Unit): HttpClient =
    HttpClient(OkHttp) {
        block(this)
        engine {
            config {
                retryOnConnectionFailure(true)
            }
        }
    }
