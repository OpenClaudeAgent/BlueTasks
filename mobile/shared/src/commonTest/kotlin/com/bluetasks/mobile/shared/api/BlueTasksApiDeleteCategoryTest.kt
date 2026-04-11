package com.bluetasks.mobile.shared.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.HttpRequestData
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.runBlocking
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Contract: category deletion must accept HTTP 204 (no body) and surface errors otherwise.
 * Regression guard for mobile settings category delete flow.
 */
class BlueTasksApiDeleteCategoryTest {
    @Test
    fun deleteCategory_succeeds_when_server_returns_204() =
        runBlocking {
            var seen: HttpRequestData? = null
            val engine =
                MockEngine { request ->
                    seen = request
                    respond("", HttpStatusCode.NoContent)
                }
            val client =
                HttpClient(engine) {
                    expectSuccess = false
                    defaultRequest {
                        url("http://bluetasks.test")
                    }
                }
            val api = BlueTasksApi(client)
            val result = api.deleteCategory("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
            client.close()

            assertTrue(result.isSuccess)
            assertEquals(HttpMethod.Delete, seen!!.method)
            assertEquals(
                "/api/categories/6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                seen!!.url.encodedPath,
            )
        }

    @Test
    fun deleteCategory_fails_when_server_returns_404() =
        runBlocking {
            val engine =
                MockEngine {
                    respond("not found", HttpStatusCode.NotFound)
                }
            val client =
                HttpClient(engine) {
                    expectSuccess = false
                    defaultRequest {
                        url("http://bluetasks.test")
                    }
                }
            val api = BlueTasksApi(client)
            val result = api.deleteCategory("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
            client.close()

            assertFalse(result.isSuccess)
            val err = result.exceptionOrNull() as? ApiException
            assertTrue(err != null)
            assertEquals(404, err.statusCode)
        }
}
