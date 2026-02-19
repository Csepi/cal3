package com.primecal.calendar.widget

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class TimelineRangeWindow(
    val startMillis: Long,
    val endMillis: Long,
    val startDateIso: String,
    val endDateIso: String,
)

object TimelineWidgetDateUtils {
    private val apiDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val readableDateFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
    private val readableDateTimeFormat = SimpleDateFormat("EEE HH:mm", Locale.getDefault())
    private val dayFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    init {
        apiDateFormat.timeZone = TimeZone.getDefault()
        readableDateFormat.timeZone = TimeZone.getDefault()
        readableDateTimeFormat.timeZone = TimeZone.getDefault()
        dayFormat.timeZone = TimeZone.getDefault()
    }

    fun resolveRangeWindow(range: TimelineDateRange, offsetSteps: Int): TimelineRangeWindow {
        val start = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val shiftDays = range.stepDays * offsetSteps
        if (shiftDays != 0) {
            start.add(Calendar.DAY_OF_YEAR, shiftDays)
        }

        val end = (start.clone() as Calendar).apply {
            when (range) {
                TimelineDateRange.TODAY -> add(Calendar.DAY_OF_YEAR, 1)
                TimelineDateRange.WEEK -> add(Calendar.DAY_OF_YEAR, 7)
                TimelineDateRange.MONTH -> add(Calendar.DAY_OF_YEAR, 30)
            }
            add(Calendar.MILLISECOND, -1)
        }

        return TimelineRangeWindow(
            startMillis = start.timeInMillis,
            endMillis = end.timeInMillis,
            startDateIso = apiDateFormat.format(Date(start.timeInMillis)),
            endDateIso = apiDateFormat.format(Date(end.timeInMillis)),
        )
    }

    fun formatRangeLabel(rangeWindow: TimelineRangeWindow): String {
        return "${readableDateFormat.format(Date(rangeWindow.startMillis))} - ${readableDateFormat.format(Date(rangeWindow.endMillis))}"
    }

    fun formatLastUpdated(timestamp: Long): String {
        if (timestamp <= 0L) {
            return ""
        }
        return readableDateTimeFormat.format(Date(timestamp))
    }

    fun formatEntryTime(startAtMillis: Long, endAtMillis: Long?, isAllDayFallback: Boolean = false): String {
        if (startAtMillis <= 0L || isAllDayFallback) {
            return "All day"
        }
        val startText = readableDateTimeFormat.format(Date(startAtMillis))
        val endText = endAtMillis?.takeIf { it > 0L }?.let { readableDateTimeFormat.format(Date(it)) }
        return if (endText != null) "$startText - $endText" else startText
    }

    fun formatDayForDeepLink(millis: Long): String {
        return dayFormat.format(Date(millis))
    }

    fun parseDateTime(dateRaw: String?, timeRaw: String?): Long {
        if (dateRaw.isNullOrBlank()) {
            return 0L
        }

        val normalizedDate = dateRaw.trim()
        if (normalizedDate.contains('T')) {
            return parseIsoTimestamp(normalizedDate)
        }

        val normalizedTime = timeRaw?.trim().takeUnless { it.isNullOrBlank() } ?: "00:00"
        val dateTimeFormats = listOf(
            SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US),
            SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US),
        )
        for (format in dateTimeFormats) {
            format.timeZone = TimeZone.getDefault()
            val parsed = runCatching { format.parse("$normalizedDate $normalizedTime") }.getOrNull()
            if (parsed != null) {
                return parsed.time
            }
        }
        return 0L
    }

    private fun parseIsoTimestamp(raw: String): Long {
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd'T'HH:mm:ssX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
        )
        patterns.forEach { pattern ->
            val format = SimpleDateFormat(pattern, Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val parsed = runCatching { format.parse(raw) }.getOrNull()
            if (parsed != null) {
                return parsed.time
            }
        }
        return 0L
    }
}

