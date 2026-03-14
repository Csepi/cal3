package com.primecal.calendar.widget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.content.res.Configuration
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
    private val fallbackRequestedLimit =
        intent.getIntExtra(TimelineWidgetProvider.EXTRA_ENTRY_LIMIT, 5).coerceIn(1, 20)
    private val repository = TimelineWidgetRepository(context)
    private var entries: List<TimelineEntry> = emptyList()
    private var rowPalette: WidgetRowPalette = WidgetRowPalette.resolve(
        context = context,
        colorScheme = TimelineWidgetColorScheme.SYSTEM,
    )

    override fun onCreate() = Unit

    override fun onDataSetChanged() {
        val appWidgetId = resolveWidgetId()
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            TimelineWidgetDebugLogger.log(
                context,
                stage = "factory.onDataSetChanged",
                message = "Unable to resolve widget ID; clearing loading state for configured widgets",
            )
            TimelineWidgetPreferences.configuredWidgetIds(context).forEach { configuredId ->
                val previous = TimelineWidgetPreferences.loadState(context, configuredId)
                TimelineWidgetPreferences.saveState(
                    context,
                    configuredId,
                    previous.copy(
                        isLoading = false,
                        lastError = context.getString(R.string.widget_error_generic),
                        loadingStartedAt = 0L,
                    ),
                )
                context.sendBroadcast(
                    Intent(context, TimelineWidgetProvider::class.java).apply {
                        action = TimelineWidgetProvider.ACTION_DATA_RENDERED
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, configuredId)
                    },
                )
            }
            entries = emptyList()
            return
        }

        TimelineWidgetDebugLogger.log(
            context,
            stage = "factory.onDataSetChanged",
            message = "Refreshing widget dataset",
            appWidgetId = appWidgetId,
        )
        val previousState = TimelineWidgetPreferences.loadState(context, appWidgetId)
        TimelineWidgetPreferences.saveState(
            context,
            appWidgetId,
            previousState.copy(
                isLoading = true,
                entryCount = entries.size,
                lastError = null,
                loadingStartedAt = System.currentTimeMillis(),
            )
        )
        runCatching {
            val config = TimelineWidgetPreferences.loadConfig(context, appWidgetId)
            rowPalette = WidgetRowPalette.resolve(context, config.colorScheme)
            val offset = TimelineWidgetPreferences.loadDateOffset(context, appWidgetId)
            val range = TimelineWidgetDateUtils.resolveRangeWindow(config.dateRange, offset)
            val forceRefresh = TimelineWidgetPreferences.consumeForceRefresh(context, appWidgetId)
            val requestedLimit = resolveEntryLimit().coerceAtMost(config.entryLimit.coerceIn(1, 20))
            TimelineWidgetDebugLogger.log(
                context,
                stage = "factory.fetch",
                message = "Loading entries from repository",
                appWidgetId = appWidgetId,
                details = mapOf(
                    "dateRange" to config.dateRange.value,
                    "offset" to offset,
                    "requestedLimit" to requestedLimit,
                    "forceRefresh" to forceRefresh,
                ),
            )

            val result = runBlocking {
                repository.loadEntries(
                    config = config,
                    rangeWindow = range,
                    limit = requestedLimit,
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
                    loadingStartedAt = 0L,
                ),
            )
            TimelineWidgetDebugLogger.log(
                context,
                stage = "factory.fetch.result",
                message = "Repository load finished",
                appWidgetId = appWidgetId,
                details = mapOf(
                    "entries" to entries.size,
                    "fromCache" to result.fromCache,
                    "hasError" to !result.errorMessage.isNullOrBlank(),
                ),
            )
        }.onFailure {
            entries = emptyList()
            TimelineWidgetPreferences.saveState(
                context,
                appWidgetId,
                TimelineWidgetState(
                    isLoading = false,
                    entryCount = 0,
                    lastUpdatedAt = previousState.lastUpdatedAt,
                    lastError = context.getString(R.string.widget_error_generic),
                    loadingStartedAt = 0L,
                ),
            )
            TimelineWidgetDebugLogger.log(
                context,
                stage = "factory.fetch.error",
                message = "Widget dataset refresh failed",
                appWidgetId = appWidgetId,
                details = mapOf("reason" to (it.message ?: "unknown")),
            )
        }

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
        row.setInt(R.id.widgetItemRoot, "setBackgroundColor", rowPalette.itemBackground)
        row.setTextViewText(R.id.widgetItemTitle, item.title)
        row.setTextColor(R.id.widgetItemTitle, rowPalette.title)
        row.setTextViewText(
            R.id.widgetItemTime,
            TimelineWidgetDateUtils.formatEntryTime(
                startAtMillis = item.startAtMillis,
                endAtMillis = item.endAtMillis,
                isAllDayFallback = item.startAtMillis <= 0L,
            ),
        )
        row.setTextColor(R.id.widgetItemTime, rowPalette.muted)
        row.setTextViewText(R.id.widgetItemCategory, item.category ?: "")
        row.setTextColor(R.id.widgetItemCategory, rowPalette.body)
        row.setInt(R.id.widgetItemCategory, "setBackgroundColor", rowPalette.chipBackground)
        row.setViewVisibility(
            R.id.widgetItemCategory,
            if (item.category.isNullOrBlank()) View.GONE else View.VISIBLE,
        )
        row.setTextViewText(R.id.widgetItemTypeIcon, item.icon ?: "\uD83D\uDCC5")
        row.setTextColor(R.id.widgetItemTypeIcon, rowPalette.body)
        row.setInt(
            R.id.widgetItemPriorityBar,
            "setBackgroundColor",
            parseColorSafe(item.colorHex, context.getColor(R.color.widget_priority_default)),
        )
        row.setTextViewText(
            R.id.widgetItemDescription,
            item.description ?: "",
        )
        row.setTextColor(R.id.widgetItemDescription, rowPalette.body)
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

    private fun resolveWidgetId(): Int {
        val fromExtra =
            intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (fromExtra != AppWidgetManager.INVALID_APPWIDGET_ID) {
            return fromExtra
        }

        val fromPath = intent.data?.lastPathSegment?.toIntOrNull()
        if (fromPath != null && fromPath != AppWidgetManager.INVALID_APPWIDGET_ID) {
            return fromPath
        }

        val fromQuery = intent.data
            ?.getQueryParameter(AppWidgetManager.EXTRA_APPWIDGET_ID)
            ?.toIntOrNull()
        if (fromQuery != null && fromQuery != AppWidgetManager.INVALID_APPWIDGET_ID) {
            return fromQuery
        }

        return TimelineWidgetPreferences.configuredWidgetIds(context).firstOrNull()
            ?: AppWidgetManager.INVALID_APPWIDGET_ID
    }

    private fun resolveEntryLimit(): Int {
        val fromExtra = intent.getIntExtra(TimelineWidgetProvider.EXTRA_ENTRY_LIMIT, -1)
        if (fromExtra > 0) {
            return fromExtra.coerceIn(1, 20)
        }

        val fromQuery = intent.data
            ?.getQueryParameter(TimelineWidgetProvider.EXTRA_ENTRY_LIMIT)
            ?.toIntOrNull()
        if (fromQuery != null && fromQuery > 0) {
            return fromQuery.coerceIn(1, 20)
        }

        return fallbackRequestedLimit
    }

    private fun parseColorSafe(value: String?, fallback: Int): Int {
        if (value.isNullOrBlank()) return fallback
        return runCatching { Color.parseColor(value) }.getOrDefault(fallback)
    }
}

private data class WidgetRowPalette(
    val itemBackground: Int,
    val chipBackground: Int,
    val title: Int,
    val body: Int,
    val muted: Int,
) {
    companion object {
        fun resolve(
            context: android.content.Context,
            colorScheme: TimelineWidgetColorScheme,
        ): WidgetRowPalette {
            val useDark = when (colorScheme) {
                TimelineWidgetColorScheme.DARK -> true
                TimelineWidgetColorScheme.LIGHT -> false
                TimelineWidgetColorScheme.SYSTEM -> {
                    (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
                        Configuration.UI_MODE_NIGHT_YES
                }
            }

            return if (useDark) {
                WidgetRowPalette(
                    itemBackground = Color.TRANSPARENT,
                    chipBackground = context.getColor(R.color.widget_surface_dark),
                    title = context.getColor(R.color.widget_text_title_dark),
                    body = context.getColor(R.color.widget_text_body_dark),
                    muted = context.getColor(R.color.widget_text_muted_dark),
                )
            } else {
                WidgetRowPalette(
                    itemBackground = Color.TRANSPARENT,
                    chipBackground = context.getColor(R.color.widget_chip_bg),
                    title = context.getColor(R.color.widget_text_title_light),
                    body = context.getColor(R.color.widget_text_body_light),
                    muted = context.getColor(R.color.widget_text_muted_light),
                )
            }
        }
    }
}
