package com.primecal.calendar.widget

import android.content.res.Resources
import com.primecal.calendar.R

enum class TimelineDateRange(
    val value: String,
    val labelResId: Int,
    val stepDays: Int,
) {
    TODAY("today", R.string.widget_range_today, 1),
    WEEK("week", R.string.widget_range_week, 7),
    MONTH("month", R.string.widget_range_month, 30),
    ;

    companion object {
        fun fromValue(raw: String?): TimelineDateRange {
            return entries.firstOrNull { it.value.equals(raw, ignoreCase = true) } ?: TODAY
        }
    }
}

enum class TimelineWidgetColorScheme(
    val value: String,
    val labelResId: Int,
) {
    SYSTEM("system", R.string.widget_color_system),
    LIGHT("light", R.string.widget_color_light),
    DARK("dark", R.string.widget_color_dark),
    ;

    companion object {
        fun fromValue(raw: String?): TimelineWidgetColorScheme {
            return entries.firstOrNull { it.value.equals(raw, ignoreCase = true) } ?: SYSTEM
        }
    }
}

enum class TimelineWidgetRefreshFrequency(
    val value: String,
    val labelResId: Int,
    val intervalMinutes: Long,
) {
    MINUTES_15("15m", R.string.widget_refresh_15m, 15),
    MINUTES_30("30m", R.string.widget_refresh_30m, 30),
    HOUR_1("1h", R.string.widget_refresh_1h, 60),
    HOURS_3("3h", R.string.widget_refresh_3h, 180),
    ;

    companion object {
        fun fromValue(raw: String?): TimelineWidgetRefreshFrequency {
            return entries.firstOrNull { it.value.equals(raw, ignoreCase = true) } ?: MINUTES_30
        }
    }
}

enum class TimelineWidgetClickBehavior(
    val value: String,
    val labelResId: Int,
) {
    OPEN_EVENT("event", R.string.widget_click_event),
    OPEN_DAY("day", R.string.widget_click_day),
    ;

    companion object {
        fun fromValue(raw: String?): TimelineWidgetClickBehavior {
            return entries.firstOrNull { it.value.equals(raw, ignoreCase = true) } ?: OPEN_EVENT
        }
    }
}

enum class TimelineWidgetSize {
    SMALL,
    MEDIUM,
    LARGE,
}

data class TimelineWidgetConfig(
    val dateRange: TimelineDateRange = TimelineDateRange.TODAY,
    val entryLimit: Int = 5,
    val colorScheme: TimelineWidgetColorScheme = TimelineWidgetColorScheme.SYSTEM,
    val refreshFrequency: TimelineWidgetRefreshFrequency = TimelineWidgetRefreshFrequency.MINUTES_30,
    val clickBehavior: TimelineWidgetClickBehavior = TimelineWidgetClickBehavior.OPEN_EVENT,
) {
    fun toPersistedMap(): Map<String, String> = mapOf(
        KEY_DATE_RANGE to dateRange.value,
        KEY_ENTRY_LIMIT to entryLimit.toString(),
        KEY_COLOR_SCHEME to colorScheme.value,
        KEY_REFRESH_FREQUENCY to refreshFrequency.value,
        KEY_CLICK_BEHAVIOR to clickBehavior.value,
    )

    companion object {
        const val KEY_DATE_RANGE = "dateRange"
        const val KEY_ENTRY_LIMIT = "entryLimit"
        const val KEY_COLOR_SCHEME = "colorScheme"
        const val KEY_REFRESH_FREQUENCY = "refreshFrequency"
        const val KEY_CLICK_BEHAVIOR = "clickBehavior"

        fun fromPersistedMap(values: Map<String, String>): TimelineWidgetConfig {
            return TimelineWidgetConfig(
                dateRange = TimelineDateRange.fromValue(values[KEY_DATE_RANGE]),
                entryLimit = values[KEY_ENTRY_LIMIT]?.toIntOrNull()?.coerceIn(1, 20) ?: 5,
                colorScheme = TimelineWidgetColorScheme.fromValue(values[KEY_COLOR_SCHEME]),
                refreshFrequency = TimelineWidgetRefreshFrequency.fromValue(values[KEY_REFRESH_FREQUENCY]),
                clickBehavior = TimelineWidgetClickBehavior.fromValue(values[KEY_CLICK_BEHAVIOR]),
            )
        }
    }
}

data class TimelineWidgetState(
    val isLoading: Boolean = false,
    val entryCount: Int = 0,
    val lastUpdatedAt: Long = 0L,
    val lastError: String? = null,
)

data class TimelineEntry(
    val id: Long,
    val title: String,
    val description: String?,
    val startAtMillis: Long,
    val endAtMillis: Long?,
    val category: String?,
    val colorHex: String?,
    val icon: String?,
    val status: String?,
)

fun enumLabels(resources: Resources, values: List<Pair<Int, String>>): List<String> {
    return values.map { (labelId, _) -> resources.getString(labelId) }
}

