package com.primecal.calendar.widget

import android.content.Context
import android.webkit.CookieManager
import com.primecal.calendar.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.Locale

data class TimelineFetchOutcome(
    val entries: List<TimelineEntry>,
    val errorMessage: String? = null,
)

/**
 * Fetches timeline entries for the widget from backend API with local fallback.
 */
class TimelineWidgetDataProvider(private val context: Context) {
    suspend fun fetchTimelineEntries(
        rangeWindow: TimelineRangeWindow,
        entryLimit: Int,
    ): TimelineFetchOutcome = withContext(Dispatchers.IO) {
        val token = obtainAccessToken()
        if (token.isNullOrBlank()) {
            val fallback = queryContentProvider(entryLimit)
            return@withContext if (fallback.isNotEmpty()) {
                TimelineFetchOutcome(
                    entries = fallback,
                    errorMessage = context.getString(R.string.widget_error_auth_cached),
                )
            } else {
                TimelineFetchOutcome(
                    entries = emptyList(),
                    errorMessage = context.getString(R.string.widget_error_auth),
                )
            }
        }

        val encodedStart = URLEncoder.encode(rangeWindow.startDateIso, "UTF-8")
        val encodedEnd = URLEncoder.encode(rangeWindow.endDateIso, "UTF-8")
        val endpoint = "$API_BASE_URL/api/events?startDate=$encodedStart&endDate=$encodedEnd"

        val response = executeRequest(
            method = "GET",
            endpoint = endpoint,
            headers = mapOf(
                "Accept" to "application/json",
                "Authorization" to "Bearer $token",
            ),
            body = null,
        )

        if (response.statusCode in 200..299) {
            val parsed = parseTimelineEntries(response.body).sortedBy { it.startAtMillis }.take(entryLimit)
            if (parsed.isEmpty()) {
                return@withContext TimelineFetchOutcome(entries = emptyList())
            }
            return@withContext TimelineFetchOutcome(entries = parsed)
        }

        if (response.statusCode == 401 || response.statusCode == 403) {
            synchronized(tokenLock) {
                cachedAccessToken = null
            }
        }

        val fallback = queryContentProvider(entryLimit)
        val message = when (response.statusCode) {
            401, 403 -> context.getString(R.string.widget_error_auth)
            else -> context.getString(R.string.widget_error_generic)
        }
        TimelineFetchOutcome(
            entries = fallback,
            errorMessage = message,
        )
    }

    private fun obtainAccessToken(): String? {
        synchronized(tokenLock) {
            if (!cachedAccessToken.isNullOrBlank()) {
                return cachedAccessToken
            }
        }

        val cookies = gatherCookies()
        if (cookies.isNullOrBlank()) {
            return null
        }

        val csrf = extractCookieValue(cookies, "cal3_csrf_token")
        val refreshResponse = executeRequest(
            method = "POST",
            endpoint = "$API_BASE_URL/api/auth/refresh",
            headers = buildMap {
                put("Content-Type", "application/json")
                put("Accept", "application/json")
                put("Cookie", cookies)
                if (!csrf.isNullOrBlank()) {
                    put("X-CSRF-Token", csrf)
                }
            },
            body = "{}",
        )

        if (refreshResponse.statusCode !in 200..299) {
            return null
        }

        val token = parseAccessToken(refreshResponse.body)
        synchronized(tokenLock) {
            cachedAccessToken = token
        }
        return token
    }

    private fun gatherCookies(): String? {
        val cookieManager = CookieManager.getInstance()
        val cookieCandidates = listOf(
            cookieManager.getCookie(APP_BASE_URL),
            cookieManager.getCookie(API_BASE_URL),
            cookieManager.getCookie("$API_BASE_URL/api/auth"),
        )
        return cookieCandidates.firstOrNull { !it.isNullOrBlank() }
    }

    private fun parseAccessToken(rawBody: String): String? {
        val root = runCatching { JSONTokener(rawBody).nextValue() }.getOrNull() ?: return null
        val container = when (root) {
            is JSONObject -> {
                val nested = root.optJSONObject("data")
                nested ?: root
            }
            else -> return null
        }
        return container.optString("access_token").takeIf { it.isNotBlank() }
    }

    private fun queryContentProvider(limit: Int): List<TimelineEntry> {
        val resolver = context.contentResolver
        val cursor = resolver.query(TimelineContentProvider.TIMELINE_URI, null, null, null, null) ?: return emptyList()
        cursor.use { c ->
            if (c.count <= 0) {
                return emptyList()
            }
            val idIndex = c.getColumnIndex("_id")
            val titleIndex = c.getColumnIndex("title")
            val descriptionIndex = c.getColumnIndex("description")
            val startIndex = c.getColumnIndex("startAtMillis")
            val endIndex = c.getColumnIndex("endAtMillis")
            val categoryIndex = c.getColumnIndex("category")
            val colorIndex = c.getColumnIndex("colorHex")
            val iconIndex = c.getColumnIndex("icon")
            val statusIndex = c.getColumnIndex("status")

            val entries = mutableListOf<TimelineEntry>()
            while (c.moveToNext() && entries.size < limit) {
                entries.add(
                    TimelineEntry(
                        id = c.getLong(idIndex),
                        title = c.getString(titleIndex) ?: "",
                        description = c.getString(descriptionIndex),
                        startAtMillis = c.getLong(startIndex),
                        endAtMillis = c.getLong(endIndex).takeIf { it > 0L },
                        category = c.getString(categoryIndex),
                        colorHex = c.getString(colorIndex),
                        icon = c.getString(iconIndex),
                        status = c.getString(statusIndex),
                    ),
                )
            }
            return entries
        }
    }

    private fun parseTimelineEntries(rawBody: String): List<TimelineEntry> {
        val root = runCatching { JSONTokener(rawBody).nextValue() }.getOrNull() ?: return emptyList()
        val sourceArray = when (root) {
            is JSONArray -> root
            is JSONObject -> {
                when (val data = root.opt("data")) {
                    is JSONArray -> data
                    else -> root.optJSONArray("events") ?: JSONArray()
                }
            }
            else -> JSONArray()
        }

        val parsed = mutableListOf<TimelineEntry>()
        for (index in 0 until sourceArray.length()) {
            val item = sourceArray.optJSONObject(index) ?: continue
            val id = item.optLong("id", -1L)
            if (id <= 0L) {
                continue
            }
            val title = item.optString("title", "").ifBlank {
                context.getString(R.string.widget_untitled_event)
            }
            val description = item.optString("description").takeIf { it.isNotBlank() && it != "null" }
            val startAt = TimelineWidgetDateUtils.parseDateTime(
                dateRaw = item.optString("startDate"),
                timeRaw = item.optString("startTime"),
            )
            val endAt = TimelineWidgetDateUtils.parseDateTime(
                dateRaw = item.optString("endDate"),
                timeRaw = item.optString("endTime"),
            ).takeIf { it > 0L }

            val calendar = item.optJSONObject("calendar")
            val category = calendar?.optString("name")?.takeIf { it.isNotBlank() }
                ?: item.optString("status").takeIf { it.isNotBlank() }
            val colorHex = item.optString("color").takeIf { it.startsWith("#") }
                ?: calendar?.optString("color")?.takeIf { it.startsWith("#") }
            val icon = item.optString("icon").takeIf { it.isNotBlank() }
                ?: when (item.optString("recurrenceType").lowercase(Locale.US)) {
                    "daily", "weekly", "monthly", "yearly" -> "\uD83D\uDD01"
                    else -> "\uD83D\uDCC5"
                }
            val status = item.optString("status").takeIf { it.isNotBlank() }

            parsed.add(
                TimelineEntry(
                    id = id,
                    title = title,
                    description = description,
                    startAtMillis = startAt,
                    endAtMillis = endAt,
                    category = category,
                    colorHex = colorHex,
                    icon = icon,
                    status = status,
                ),
            )
        }
        return parsed
    }

    private fun executeRequest(
        method: String,
        endpoint: String,
        headers: Map<String, String>,
        body: String?,
    ): HttpResult {
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = REQUEST_CONNECT_TIMEOUT_MS
            readTimeout = REQUEST_READ_TIMEOUT_MS
            doInput = true
            doOutput = body != null
            instanceFollowRedirects = true
            headers.forEach { (name, value) -> setRequestProperty(name, value) }
        }
        return try {
            if (body != null) {
                OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                    writer.write(body)
                    writer.flush()
                }
            }

            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val responseBody = stream?.let { input ->
                BufferedReader(input.reader(Charsets.UTF_8)).use { it.readText() }
            } ?: ""
            HttpResult(code, responseBody)
        } catch (_: Exception) {
            HttpResult(-1, "")
        } finally {
            connection.disconnect()
        }
    }

    private fun extractCookieValue(cookieHeader: String, cookieName: String): String? {
        val prefix = "$cookieName="
        return cookieHeader.split(';')
            .map { it.trim() }
            .firstOrNull { it.startsWith(prefix) }
            ?.removePrefix(prefix)
            ?.takeIf { it.isNotBlank() }
    }

    private data class HttpResult(
        val statusCode: Int,
        val body: String,
    )

    companion object {
        private const val APP_BASE_URL = "https://app.primecal.eu"
        private const val API_BASE_URL = "https://api.primecal.eu"
        private const val REQUEST_CONNECT_TIMEOUT_MS = 10_000
        private const val REQUEST_READ_TIMEOUT_MS = 15_000

        private val tokenLock = Any()
        @Volatile
        private var cachedAccessToken: String? = null
    }
}
