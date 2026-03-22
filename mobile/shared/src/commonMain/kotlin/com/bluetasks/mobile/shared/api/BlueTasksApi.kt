package com.bluetasks.mobile.shared.api

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.isSuccess

public class BlueTasksApi(
    private val client: HttpClient,
) {
    public suspend fun getTasks(): Result<List<ApiTaskRow>> =
        runCatching {
            val response: HttpResponse = client.get("/api/tasks")
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun createTask(payload: TaskWritePayload): Result<ApiTaskRow> =
        runCatching {
            val response: HttpResponse = client.post("/api/tasks") { setBody(payload) }
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun updateTask(
        id: String,
        payload: TaskWritePayload,
    ): Result<ApiTaskRow> =
        runCatching {
            val response: HttpResponse = client.put("/api/tasks/$id") { setBody(payload) }
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun deleteTask(id: String): Result<Unit> =
        runCatching {
            val response: HttpResponse = client.delete("/api/tasks/$id")
            if (response.status.value == 204) return@runCatching
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
        }

    public suspend fun getCategories(): Result<List<ApiCategoryRow>> =
        runCatching {
            val response: HttpResponse = client.get("/api/categories")
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun createCategory(body: CreateCategoryBody): Result<ApiCategoryRow> =
        runCatching {
            val response: HttpResponse = client.post("/api/categories") { setBody(body) }
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun updateCategory(
        id: String,
        body: UpdateCategoryBody,
    ): Result<ApiCategoryRow> =
        runCatching {
            val response: HttpResponse = client.put("/api/categories/$id") { setBody(body) }
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun deleteCategory(id: String): Result<Unit> =
        runCatching {
            val response: HttpResponse = client.delete("/api/categories/$id")
            if (response.status.value == 204) return@runCatching
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
        }

    public suspend fun exportDatabase(): Result<ByteArray> =
        runCatching {
            val response: HttpResponse = client.get("/api/export/database")
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }

    public suspend fun importDatabase(sqliteBytes: ByteArray): Result<Unit> =
        runCatching {
            val response: HttpResponse =
                client.post("/api/import/database") {
                    setBody(
                        MultiPartFormDataContent(
                            formData {
                                append(
                                    "database",
                                    sqliteBytes,
                                    Headers.build {
                                        append(
                                            HttpHeaders.ContentDisposition,
                                            "form-data; name=\"database\"; filename=\"import.sqlite\"",
                                        )
                                        append(HttpHeaders.ContentType, "application/vnd.sqlite3")
                                    },
                                )
                            },
                        ),
                    )
                }
            if (response.status.value == 204) return@runCatching
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
        }
}

public data class ApiException(
    val statusCode: Int,
    val body: String,
) : Exception("HTTP $statusCode: $body")
