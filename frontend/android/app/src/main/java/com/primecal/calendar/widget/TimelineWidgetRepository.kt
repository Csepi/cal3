package com.primecal.calendar.widget

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class TimelineRepositoryResult(
    val entries: List<TimelineEntry>,
    val errorMessage: String? = null,
    val lastUpdatedAt: Long = 0L,
    val fromCache: Boolean = false,
)

/**
 * Repository layer used by widgets to combine network, content-provider fallback, and cache.
 */
class TimelineWidgetRepository(private val context: Context) {
    private val appContext = context.applicationContext
    private val provider = TimelineWidgetDataProvider(appContext)

    suspend fun loadEntries(
        config: TimelineWidgetConfig,
        rangeWindow: TimelineRangeWindow,
        limit: Int,
        forceRefresh: Boolean,
    ): TimelineRepositoryResult = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val (cachedEntries, cachedAt) = TimelineWidgetPreferences.loadCachedEntries(appContext)
        val filteredCached = filterByRange(cachedEntries, rangeWindow).take(limit)
        val cacheAge = now - cachedAt
        if (!forceRefresh && filteredCached.isNotEmpty() && cacheAge in 1 until CACHE_TTL_MS) {
            return@withContext TimelineRepositoryResult(
                entries = filteredCached,
                lastUpdatedAt = cachedAt,
                fromCache = true,
            )
        }

        val outcome = provider.fetchTimelineEntries(
            rangeWindow = rangeWindow,
            entryLimit = limit.coerceIn(1, 20),
        )

        if (outcome.errorMessage == null) {
            TimelineWidgetPreferences.saveCachedEntries(appContext, outcome.entries, now)
            appContext.contentResolver.notifyChange(TimelineContentProvider.TIMELINE_URI, null)
            return@withContext TimelineRepositoryResult(
                entries = outcome.entries,
                lastUpdatedAt = now,
                fromCache = false,
            )
        }

        if (filteredCached.isNotEmpty()) {
            return@withContext TimelineRepositoryResult(
                entries = filteredCached,
                errorMessage = outcome.errorMessage,
                lastUpdatedAt = cachedAt,
                fromCache = true,
            )
        }

        TimelineRepositoryResult(
            entries = outcome.entries,
            errorMessage = outcome.errorMessage,
            lastUpdatedAt = if (outcome.entries.isNotEmpty()) now else cachedAt,
            fromCache = false,
        )
    }

    private fun filterByRange(entries: List<TimelineEntry>, rangeWindow: TimelineRangeWindow): List<TimelineEntry> {
        return entries
            .asSequence()
            .filter { entry ->
                val start = entry.startAtMillis
                start == 0L || (start >= rangeWindow.startMillis && start <= rangeWindow.endMillis)
            }
            .sortedBy { it.startAtMillis }
            .toList()
    }

    companion object {
        private const val CACHE_TTL_MS = 5 * 60 * 1000L
    }
}

