package com.primecal.calendar.widget

import android.content.Context
import android.os.Build
import java.time.Instant

/**
 * Lightweight diagnostics logger for timeline widget lifecycle/data-fetch events.
 * Logs are stored in SharedPreferences so they can be copied from the mobile app UI.
 */
object TimelineWidgetDebugLogger {
    private const val PREFS_NAME = "timeline_widget_debug"
    private const val KEY_LINES = "lines"
    private const val MAX_LINES = 250
    private val lock = Any()

    fun log(
        context: Context,
        stage: String,
        message: String,
        appWidgetId: Int? = null,
        details: Map<String, Any?> = emptyMap(),
    ) {
        val cleanDetails = details.entries
            .filter { it.value != null }
            .joinToString(" | ") { (key, value) ->
                "$key=${value.toString().replace('\n', ' ').take(240)}"
            }
        val line = buildString {
            append(Instant.now().toString())
            append(" | ")
            append(stage)
            append(" | ")
            if (appWidgetId != null) {
                append("widget=")
                append(appWidgetId)
                append(" | ")
            }
            append(message)
            if (cleanDetails.isNotBlank()) {
                append(" | ")
                append(cleanDetails)
            }
        }

        synchronized(lock) {
            val prefs = prefs(context)
            val existing = prefs.getString(KEY_LINES, "").orEmpty()
            val merged = buildList {
                if (existing.isNotBlank()) {
                    addAll(existing.split('\n').filter { it.isNotBlank() })
                }
                add(line)
            }.takeLast(MAX_LINES)
            prefs.edit()
                .putString(KEY_LINES, merged.joinToString("\n"))
                .apply()
        }
    }

    fun snapshot(context: Context): String {
        val lines = synchronized(lock) {
            prefs(context).getString(KEY_LINES, "").orEmpty()
                .split('\n')
                .filter { it.isNotBlank() }
        }
        return buildString {
            appendLine("============================================================")
            appendLine("PrimeCal - Widget Diagnostics")
            appendLine("============================================================")
            appendLine("Generated: ${Instant.now()}")
            appendLine("Android API: ${Build.VERSION.SDK_INT}")
            appendLine("Device: ${Build.MANUFACTURER} ${Build.MODEL}")
            appendLine("Configured widgets: ${TimelineWidgetPreferences.configuredWidgetIds(context).size}")
            appendLine()
            appendLine("Event Log:")
            if (lines.isEmpty()) {
                appendLine("(No widget diagnostics recorded yet)")
            } else {
                lines.forEach { appendLine(it) }
            }
        }
    }

    fun clear(context: Context) {
        synchronized(lock) {
            prefs(context).edit().remove(KEY_LINES).apply()
        }
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}

