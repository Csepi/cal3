package com.primecal.calendar.widget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.primecal.calendar.R
import kotlinx.coroutines.runBlocking

class TimelineWidgetRemoteViewsService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return TimelineWidgetRemoteViewsFactory(applicationContext, intent)
    }
}

private class TimelineWidgetRemoteViewsFactory(
    private val context: android.content.Context,
    private val intent: Intent,
) : RemoteViewsService.RemoteViewsFactory {
    private val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    private val requestedLimit = intent.getIntExtra(TimelineWidgetProvider.EXTRA_ENTRY_LIMIT, 5).coerceIn(1, 20)
    private val repository = TimelineWidgetRepository(context)
    private var entries: List<TimelineEntry> = emptyList()

    override fun onCreate() = Unit

    override fun onDataSetChanged() {
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            entries = emptyList()
            return
        }

        val config = TimelineWidgetPreferences.loadConfig(context, appWidgetId)
        val offset = TimelineWidgetPreferences.loadDateOffset(context, appWidgetId)
        val range = TimelineWidgetDateUtils.resolveRangeWindow(config.dateRange, offset)
        val forceRefresh = TimelineWidgetPreferences.consumeForceRefresh(context, appWidgetId)

        TimelineWidgetPreferences.saveState(
            context,
            appWidgetId,
            TimelineWidgetState(
                isLoading = true,
                entryCount = entries.size,
                lastUpdatedAt = TimelineWidgetPreferences.loadState(context, appWidgetId).lastUpdatedAt,
                lastError = null,
            ),
        )

        val result = runBlocking {
            repository.loadEntries(
                config = config,
                rangeWindow = range,
                limit = requestedLimit.coerceAtMost(config.entryLimit.coerceIn(1, 20)),
                forceRefresh = forceRefresh,
            )
        }

        entries = result.entries
        TimelineWidgetPreferences.saveState(
            context,
            appWidgetId,
            TimelineWidgetState(
                isLoading = false,
                entryCount = entries.size,
                lastUpdatedAt = result.lastUpdatedAt,
                lastError = result.errorMessage,
            ),
        )

        val updateIntent = Intent(context, TimelineWidgetProvider::class.java).apply {
            action = TimelineWidgetProvider.ACTION_DATA_RENDERED
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        context.sendBroadcast(updateIntent)
    }

    override fun onDestroy() {
        entries = emptyList()
    }

    override fun getCount(): Int = entries.size

    override fun getViewAt(position: Int): RemoteViews? {
        val item = entries.getOrNull(position) ?: return null
        val row = RemoteViews(context.packageName, R.layout.widget_timeline_item)
        row.setTextViewText(R.id.widgetItemTitle, item.title)
        row.setTextViewText(
            R.id.widgetItemTime,
            TimelineWidgetDateUtils.formatEntryTime(
                startAtMillis = item.startAtMillis,
                endAtMillis = item.endAtMillis,
                isAllDayFallback = item.startAtMillis <= 0L,
            ),
        )
        row.setTextViewText(R.id.widgetItemCategory, item.category ?: "")
        row.setViewVisibility(
            R.id.widgetItemCategory,
            if (item.category.isNullOrBlank()) View.GONE else View.VISIBLE,
        )
        row.setTextViewText(R.id.widgetItemTypeIcon, item.icon ?: "\uD83D\uDCC5")
        row.setInt(
            R.id.widgetItemPriorityBar,
            "setBackgroundColor",
            parseColorSafe(item.colorHex, context.getColor(R.color.widget_priority_default)),
        )
        row.setTextViewText(
            R.id.widgetItemDescription,
            item.description ?: "",
        )
        row.setViewVisibility(
            R.id.widgetItemDescription,
            if (item.description.isNullOrBlank()) View.GONE else View.VISIBLE,
        )

        val fillInIntent = Intent().apply {
            putExtra(TimelineWidgetProvider.EXTRA_ENTRY_ID, item.id)
            putExtra(TimelineWidgetProvider.EXTRA_ENTRY_START_MILLIS, item.startAtMillis)
        }
        row.setOnClickFillInIntent(R.id.widgetItemRoot, fillInIntent)
        return row
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = entries.getOrNull(position)?.id ?: position.toLong()

    override fun hasStableIds(): Boolean = true

    private fun parseColorSafe(value: String?, fallback: Int): Int {
        if (value.isNullOrBlank()) return fallback
        return runCatching { Color.parseColor(value) }.getOrDefault(fallback)
    }
}

