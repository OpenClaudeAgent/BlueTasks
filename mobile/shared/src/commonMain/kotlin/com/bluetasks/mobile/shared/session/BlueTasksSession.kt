package com.bluetasks.mobile.shared.session

import com.bluetasks.mobile.shared.api.BlueTasksApi
import com.bluetasks.mobile.shared.http.createBlueTasksHttpClient
import io.ktor.client.HttpClient

public class BlueTasksSession(
    public val api: BlueTasksApi,
    private val client: HttpClient,
) {
    public fun close() {
        client.close()
    }
}

public fun openBlueTasksSession(
    baseUrl: String,
    debugLogging: Boolean = false,
): BlueTasksSession? {
    val trimmed = baseUrl.trim().trimEnd('/')
    if (trimmed.isEmpty()) {
        return null
    }
    val normalized =
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "http://$trimmed"
        }
    val client = createBlueTasksHttpClient(normalized, debugLogging = debugLogging)
    return BlueTasksSession(BlueTasksApi(client), client)
}
