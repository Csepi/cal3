package com.primecal.calendar.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * SharedPreferences-backed storage for per-widget configuration and runtime state.
 */
object TimelineWidgetPreferences {
    private const val PREFS_NAME = "timeline_widget_prefs"
    private const val KEY_CONFIG_PREFIX = "config_"
    private const val KEY_OFFSET_PREFIX = "offset_"
    private const val KEY_STATE_PREFIX = "state_"
    private const val KEY_FORCE_REFRESH_PREFIX = "force_refresh_"
    private const val KEY_CACHE_TIMESTAMP = "cache_ts"
    private const val KEY_CACHE_ENTRIES = "cache_entries"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun loadConfig(context: Context, appWidgetId: Int): TimelineWidgetConfig {
        val raw = prefs(context).getString("$KEY_CONFIG_PREFIX$appWidgetId", null) ?: return TimelineWidgetConfig()
        return runCatching {
            val json = JSONObject(raw)
            val map = mutableMapOf<String, String>()
            json.keys().forEach { key ->
                map[key] = json.optString(key)
            }
            TimelineWidgetConfig.fromPersistedMap(map)
        }.getOrDefault(TimelineWidgetConfig())
    }

    fun saveConfig(context: Context, appWidgetId: Int, config: TimelineWidgetConfig) {
        val json = JSONObject(config.toPersistedMap())
        prefs(context).edit().putString("$KEY_CONFIG_PREFIX$appWidgetId", json.toString()).apply()
    }

    fun deleteWidget(context: Context, appWidgetId: Int) {
        prefs(context).edit()
            .remove("$KEY_CONFIG_PREFIX$appWidgetId")
            .remove("$KEY_OFFSET_PREFIX$appWidgetId")
            .remove("$KEY_STATE_PREFIX$appWidgetId")
            .remove("$KEY_FORCE_REFRESH_PREFIX$appWidgetId")
            .apply()
    }

    fun saveDateOffset(context: Context, appWidgetId: Int, offsetSteps: Int) {
        prefs(context).edit().putInt("$KEY_OFFSET_PREFIX$appWidgetId", offsetSteps).apply()
    }

    fun loadDateOffset(context: Context, appWidgetId: Int): Int {
        return prefs(context).getInt("$KEY_OFFSET_PREFIX$appWidgetId", 0)
    }

    fun saveState(context: Context, appWidgetId: Int, state: TimelineWidgetState) {
        val json = JSONObject().apply {
            put("loading", state.isLoading)
            put("entryCount", state.entryCount)
            put("updatedAt", state.lastUpdatedAt)
            put("lastError", state.lastError ?: JSONObject.NULL)
        }
        prefs(context).edit().putString("$KEY_STATE_PREFIX$appWidgetId", json.toString()).apply()
    }

    fun loadState(context: Context, appWidgetId: Int): TimelineWidgetState {
        val raw = prefs(context).getString("$KEY_STATE_PREFIX$appWidgetId", null) ?: return TimelineWidgetState()
        return runCatching {
            val json = JSONObject(raw)
            TimelineWidgetState(
                isLoading = json.optBoolean("loading", false),
                entryCount = json.optInt("entryCount", 0),
                lastUpdatedAt = json.optLong("updatedAt", 0L),
                lastError = json.optString("lastError").takeIf { it.isNotBlank() && it != "null" },
            )
        }.getOrDefault(TimelineWidgetState())
    }

    fun markForceRefresh(context: Context, appWidgetId: Int, value: Boolean) {
        prefs(context).edit().putBoolean("$KEY_FORCE_REFRESH_PREFIX$appWidgetId", value).apply()
    }

    fun consumeForceRefresh(context: Context, appWidgetId: Int): Boolean {
        val key = "$KEY_FORCE_REFRESH_PREFIX$appWidgetId"
        val value = prefs(context).getBoolean(key, false)
        if (value) {
            prefs(context).edit().putBoolean(key, false).apply()
        }
        return value
    }

    fun saveCachedEntries(context: Context, entries: List<TimelineEntry>, timestamp: Long) {
        val payload = JSONArray()
        entries.forEach { entry ->
            payload.put(
                JSONObject().apply {
                    put("id", entry.id)
                    put("title", entry.title)
                    put("description", entry.description ?: JSONObject.NULL)
                    put("startAtMillis", entry.startAtMillis)
                    put("endAtMillis", entry.endAtMillis ?: JSONObject.NULL)
                    put("category", entry.category ?: JSONObject.NULL)
                    put("colorHex", entry.colorHex ?: JSONObject.NULL)
                    put("icon", entry.icon ?: JSONObject.NULL)
                    put("status", entry.status ?: JSONObject.NULL)
                },
            )
        }
        prefs(context).edit()
            .putString(KEY_CACHE_ENTRIES, payload.toString())
            .putLong(KEY_CACHE_TIMESTAMP, timestamp)
            .apply()
    }

    fun loadCachedEntries(context: Context): Pair<List<TimelineEntry>, Long> {
        val raw = prefs(context).getString(KEY_CACHE_ENTRIES, null)
        if (raw.isNullOrBlank()) {
            return emptyList<TimelineEntry>() to 0L
        }
        val timestamp = prefs(context).getLong(KEY_CACHE_TIMESTAMP, 0L)
        return runCatching {
            val array = JSONArray(raw)
            val items = buildList {
                for (index in 0 until array.length()) {
                    val item = array.optJSONObject(index) ?: continue
                    add(
                        TimelineEntry(
                            id = item.optLong("id"),
                            title = item.optString("title", ""),
                            description = item.optString("description").takeIf { it.isNotBlank() && it != "null" },
                            startAtMillis = item.optLong("startAtMillis", 0L),
                            endAtMillis = item.optLong("endAtMillis").takeIf { value -> value > 0L },
                            category = item.optString("category").takeIf { it.isNotBlank() && it != "null" },
                            colorHex = item.optString("colorHex").takeIf { it.isNotBlank() && it != "null" },
                            icon = item.optString("icon").takeIf { it.isNotBlank() && it != "null" },
                            status = item.optString("status").takeIf { it.isNotBlank() && it != "null" },
                        ),
                    )
                }
            }
            items to timestamp
        }.getOrDefault(emptyList<TimelineEntry>() to 0L)
    }

    fun configuredWidgetIds(context: Context): Set<Int> {
        return prefs(context).all.keys
            .asSequence()
            .filter { it.startsWith(KEY_CONFIG_PREFIX) }
            .mapNotNull { key -> key.removePrefix(KEY_CONFIG_PREFIX).toIntOrNull() }
            .toSet()
    }
}

