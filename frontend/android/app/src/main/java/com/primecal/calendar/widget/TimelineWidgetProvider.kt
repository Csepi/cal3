package com.primecal.calendar.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.widget.RemoteViews
import com.primecal.calendar.R
import kotlin.math.max
import kotlin.math.min

class TimelineWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        appWidgetIds.forEach { appWidgetId ->
            if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return@forEach
            val config = TimelineWidgetPreferences.loadConfig(context, appWidgetId)
            TimelineWidgetPreferences.saveConfig(context, appWidgetId, config)
            requestDataRefresh(context, appWidgetManager, appWidgetId, forceRefresh = false)
        }
        TimelineWidgetUpdateScheduler.schedulePeriodic(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: android.os.Bundle,
    ) {
        requestDataRefresh(context, appWidgetManager, appWidgetId, forceRefresh = false)
    }

    override fun onEnabled(context: Context) {
        TimelineWidgetUpdateScheduler.schedulePeriodic(context)
    }

    override fun onDisabled(context: Context) {
        TimelineWidgetUpdateScheduler.cancelPeriodic(context)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        appWidgetIds.forEach { TimelineWidgetPreferences.deleteWidget(context, it) }
        if (allWidgetIds(context).isEmpty()) {
            TimelineWidgetUpdateScheduler.cancelPeriodic(context)
        } else {
            TimelineWidgetUpdateScheduler.schedulePeriodic(context)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val appWidgetManager = AppWidgetManager.getInstance(context)
        when (intent.action) {
            ACTION_REFRESH -> {
                val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (id == AppWidgetManager.INVALID_APPWIDGET_ID) {
                    refreshAllWidgets(context, forceRefresh = true)
                } else {
                    requestDataRefresh(context, appWidgetManager, id, forceRefresh = true)
                }
            }

            ACTION_PREVIOUS_RANGE -> {
                val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val current = TimelineWidgetPreferences.loadDateOffset(context, id)
                    TimelineWidgetPreferences.saveDateOffset(context, id, current - 1)
                    requestDataRefresh(context, appWidgetManager, id, forceRefresh = true)
                }
            }

            ACTION_NEXT_RANGE -> {
                val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val current = TimelineWidgetPreferences.loadDateOffset(context, id)
                    TimelineWidgetPreferences.saveDateOffset(context, id, current + 1)
                    requestDataRefresh(context, appWidgetManager, id, forceRefresh = true)
                }
            }

            ACTION_OPEN_ENTRY -> {
                val widgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                val entryId = intent.getLongExtra(EXTRA_ENTRY_ID, -1L)
                val startAt = intent.getLongExtra(EXTRA_ENTRY_START_MILLIS, 0L)
                if (entryId > 0L) {
                    val config = TimelineWidgetPreferences.loadConfig(context, widgetId)
                    val targetUri = when (config.clickBehavior) {
                        TimelineWidgetClickBehavior.OPEN_EVENT ->
                            "$APP_BASE_URL/calendar?eventId=$entryId"
                        TimelineWidgetClickBehavior.OPEN_DAY -> {
                            val date = TimelineWidgetDateUtils.formatDayForDeepLink(startAt)
                            "$APP_BASE_URL/calendar?date=$date"
                        }
                    }
                    openDeepLink(context, targetUri)
                }
            }

            ACTION_QUICK_ADD -> openDeepLink(context, "$APP_BASE_URL/calendar?quickAdd=1")

            ACTION_OPEN_APP -> openDeepLink(context, APP_BASE_URL)

            ACTION_DATA_RENDERED -> {
                val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    renderFromState(context, appWidgetManager, id)
                }
            }

            ACTION_TIMELINE_DATA_CHANGED -> {
                refreshAllWidgets(context, forceRefresh = true)
            }
        }
    }

    private fun requestDataRefresh(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        forceRefresh: Boolean,
    ) {
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return
        val state = TimelineWidgetPreferences.loadState(context, appWidgetId)
        TimelineWidgetPreferences.saveState(
            context,
            appWidgetId,
            state.copy(isLoading = true, lastError = null),
        )
        TimelineWidgetPreferences.markForceRefresh(context, appWidgetId, forceRefresh)

        val views = buildRemoteViews(context, appWidgetManager, appWidgetId)
        appWidgetManager.updateAppWidget(appWidgetId, views)
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widgetTimelineList)
    }

    private fun renderFromState(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
    ) {
        val views = buildRemoteViews(context, appWidgetManager, appWidgetId)
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun buildRemoteViews(
        context: Context,
        manager: AppWidgetManager,
        appWidgetId: Int,
    ): RemoteViews {
        val config = TimelineWidgetPreferences.loadConfig(context, appWidgetId)
        val state = TimelineWidgetPreferences.loadState(context, appWidgetId)
        val offset = TimelineWidgetPreferences.loadDateOffset(context, appWidgetId)
        val options = manager.getAppWidgetOptions(appWidgetId)
        val size = resolveSize(options)
        val layout = when (size) {
            TimelineWidgetSize.SMALL -> R.layout.widget_timeline_small
            TimelineWidgetSize.MEDIUM -> R.layout.widget_timeline_medium
            TimelineWidgetSize.LARGE -> R.layout.widget_timeline_large
        }
        val entryLimit = max(1, min(config.entryLimit, maxEntriesForSize(size)))
        val rangeWindow = TimelineWidgetDateUtils.resolveRangeWindow(config.dateRange, offset)
        val palette = WidgetPalette.resolve(context, config.colorScheme)

        return RemoteViews(context.packageName, layout).apply {
            setTextViewText(R.id.widgetTitle, context.getString(R.string.widget_title))
            setTextViewText(R.id.widgetRange, TimelineWidgetDateUtils.formatRangeLabel(rangeWindow))
            setTextViewText(
                R.id.widgetLastUpdated,
                if (state.lastUpdatedAt > 0L) {
                    context.getString(
                        R.string.widget_last_updated,
                        TimelineWidgetDateUtils.formatLastUpdated(state.lastUpdatedAt),
                    )
                } else {
                    context.getString(R.string.widget_last_updated_never)
                },
            )

            val stateText = when {
                state.isLoading -> context.getString(R.string.widget_state_loading)
                !state.lastError.isNullOrBlank() && state.entryCount == 0 ->
                    context.getString(R.string.widget_state_error_retry)
                state.entryCount == 0 -> context.getString(R.string.widget_state_empty)
                else -> ""
            }
            setTextViewText(R.id.widgetStateText, stateText)
            setViewVisibility(
                R.id.widgetStateText,
                if (stateText.isBlank()) android.view.View.GONE else android.view.View.VISIBLE,
            )
            setViewVisibility(
                R.id.widgetLoadingView,
                if (state.isLoading) android.view.View.VISIBLE else android.view.View.GONE,
            )

            setEmptyView(R.id.widgetTimelineList, R.id.widgetStateText)

            val serviceIntent = Intent(context, TimelineWidgetRemoteViewsService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                putExtra(EXTRA_ENTRY_LIMIT, entryLimit)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            setRemoteAdapter(R.id.widgetTimelineList, serviceIntent)

            val itemTemplateIntent = Intent(context, TimelineWidgetProvider::class.java).apply {
                action = ACTION_OPEN_ENTRY
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            setPendingIntentTemplate(
                R.id.widgetTimelineList,
                PendingIntent.getBroadcast(
                    context,
                    appWidgetId,
                    itemTemplateIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
                ),
            )

            setOnClickPendingIntent(
                R.id.btnRefresh,
                buildActionPendingIntent(context, appWidgetId, ACTION_REFRESH),
            )
            setOnClickPendingIntent(
                R.id.btnPrev,
                buildActionPendingIntent(context, appWidgetId, ACTION_PREVIOUS_RANGE),
            )
            setOnClickPendingIntent(
                R.id.btnNext,
                buildActionPendingIntent(context, appWidgetId, ACTION_NEXT_RANGE),
            )
            setOnClickPendingIntent(
                R.id.btnAdd,
                buildActionPendingIntent(context, appWidgetId, ACTION_QUICK_ADD),
            )
            setOnClickPendingIntent(
                R.id.widgetHeaderTapTarget,
                buildActionPendingIntent(context, appWidgetId, ACTION_OPEN_APP),
            )

            setInt(R.id.widgetRoot, "setBackgroundColor", palette.background)
            setTextColor(R.id.widgetTitle, palette.title)
            setTextColor(R.id.widgetRange, palette.body)
            setTextColor(R.id.widgetLastUpdated, palette.muted)
            setTextColor(R.id.widgetStateText, palette.body)
            setInt(R.id.widgetToolbarBackground, "setBackgroundColor", palette.toolbarBackground)
            setInt(R.id.widgetFooterBackground, "setBackgroundColor", palette.footerBackground)
        }
    }

    private fun buildActionPendingIntent(
        context: Context,
        appWidgetId: Int,
        action: String,
    ): PendingIntent {
        val intent = Intent(context, TimelineWidgetProvider::class.java).apply {
            this.action = action
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        return PendingIntent.getBroadcast(
            context,
            (action.hashCode() * 31) + appWidgetId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun resolveSize(options: android.os.Bundle): TimelineWidgetSize {
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)
        return when {
            minWidth >= 250 && minHeight >= 250 -> TimelineWidgetSize.LARGE
            minWidth >= 180 || minHeight >= 120 -> TimelineWidgetSize.MEDIUM
            else -> TimelineWidgetSize.SMALL
        }
    }

    private fun maxEntriesForSize(size: TimelineWidgetSize): Int {
        return when (size) {
            TimelineWidgetSize.SMALL -> 3
            TimelineWidgetSize.MEDIUM -> 7
            TimelineWidgetSize.LARGE -> 12
        }
    }

    private fun openDeepLink(context: Context, uri: String) {
        val launchIntent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        context.startActivity(launchIntent)
    }

    companion object {
        const val ACTION_REFRESH = "com.primecal.calendar.widget.ACTION_REFRESH"
        const val ACTION_PREVIOUS_RANGE = "com.primecal.calendar.widget.ACTION_PREVIOUS_RANGE"
        const val ACTION_NEXT_RANGE = "com.primecal.calendar.widget.ACTION_NEXT_RANGE"
        const val ACTION_OPEN_ENTRY = "com.primecal.calendar.widget.ACTION_OPEN_ENTRY"
        const val ACTION_QUICK_ADD = "com.primecal.calendar.widget.ACTION_QUICK_ADD"
        const val ACTION_OPEN_APP = "com.primecal.calendar.widget.ACTION_OPEN_APP"
        const val ACTION_DATA_RENDERED = "com.primecal.calendar.widget.ACTION_DATA_RENDERED"
        const val ACTION_TIMELINE_DATA_CHANGED = "com.primecal.calendar.widget.ACTION_TIMELINE_DATA_CHANGED"

        const val EXTRA_ENTRY_LIMIT = "extra_entry_limit"
        const val EXTRA_ENTRY_ID = "extra_entry_id"
        const val EXTRA_ENTRY_START_MILLIS = "extra_entry_start_millis"

        private const val APP_BASE_URL = "https://app.primecal.eu"

        fun refreshAllWidgets(context: Context, forceRefresh: Boolean) {
            val manager = AppWidgetManager.getInstance(context)
            val provider = ComponentName(context, TimelineWidgetProvider::class.java)
            manager.getAppWidgetIds(provider).forEach { appWidgetId ->
                if (forceRefresh) {
                    TimelineWidgetPreferences.markForceRefresh(context, appWidgetId, true)
                }
                val refreshIntent = Intent(context, TimelineWidgetProvider::class.java).apply {
                    action = ACTION_REFRESH
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                }
                context.sendBroadcast(refreshIntent)
            }
        }

        fun requestImmediateRefresh(context: Context, appWidgetId: Int) {
            val refreshIntent = Intent(context, TimelineWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            context.sendBroadcast(refreshIntent)
        }

        fun allWidgetIds(context: Context): IntArray {
            val manager = AppWidgetManager.getInstance(context)
            return manager.getAppWidgetIds(ComponentName(context, TimelineWidgetProvider::class.java))
        }
    }
}

private data class WidgetPalette(
    val background: Int,
    val toolbarBackground: Int,
    val footerBackground: Int,
    val title: Int,
    val body: Int,
    val muted: Int,
) {
    companion object {
        fun resolve(context: Context, colorScheme: TimelineWidgetColorScheme): WidgetPalette {
            val useDark = when (colorScheme) {
                TimelineWidgetColorScheme.DARK -> true
                TimelineWidgetColorScheme.LIGHT -> false
                TimelineWidgetColorScheme.SYSTEM -> {
                    (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
                }
            }
            return if (useDark) {
                WidgetPalette(
                    background = context.getColor(R.color.widget_bg_dark),
                    toolbarBackground = context.getColor(R.color.widget_surface_dark),
                    footerBackground = context.getColor(R.color.widget_surface_dark),
                    title = context.getColor(R.color.widget_text_title_dark),
                    body = context.getColor(R.color.widget_text_body_dark),
                    muted = context.getColor(R.color.widget_text_muted_dark),
                )
            } else {
                WidgetPalette(
                    background = context.getColor(R.color.widget_bg_light),
                    toolbarBackground = context.getColor(R.color.widget_surface_light),
                    footerBackground = context.getColor(R.color.widget_surface_light),
                    title = context.getColor(R.color.widget_text_title_light),
                    body = context.getColor(R.color.widget_text_body_light),
                    muted = context.getColor(R.color.widget_text_muted_light),
                )
            }
        }
    }
}

