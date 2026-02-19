package com.primecal.calendar.widget

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object TimelineWidgetUpdateScheduler {
    fun schedulePeriodic(context: Context) {
        val appContext = context.applicationContext
        val widgetIds = TimelineWidgetProvider.allWidgetIds(appContext)
        if (widgetIds.isEmpty()) {
            cancelPeriodic(appContext)
            return
        }

        val intervalMinutes = resolveMinIntervalMinutes(appContext, widgetIds)
        val request = PeriodicWorkRequestBuilder<TimelineWidgetWorker>(
            intervalMinutes,
            TimeUnit.MINUTES,
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build(),
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(appContext).enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    fun enqueueImmediate(context: Context, forceRefresh: Boolean) {
        val request = OneTimeWorkRequestBuilder<TimelineWidgetWorker>()
            .setInputData(
                androidx.work.Data.Builder()
                    .putBoolean(TimelineWidgetWorker.KEY_FORCE_REFRESH, forceRefresh)
                    .build(),
            )
            .build()
        WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
            IMMEDIATE_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }

    fun cancelPeriodic(context: Context) {
        WorkManager.getInstance(context.applicationContext).cancelUniqueWork(PERIODIC_WORK_NAME)
    }

    private fun resolveMinIntervalMinutes(context: Context, widgetIds: IntArray): Long {
        val minConfigured = widgetIds
            .map { TimelineWidgetPreferences.loadConfig(context, it).refreshFrequency.intervalMinutes }
            .minOrNull()
            ?: TimelineWidgetRefreshFrequency.MINUTES_30.intervalMinutes
        return minConfigured.coerceAtLeast(MIN_ALLOWED_INTERVAL_MINUTES)
    }

    private const val PERIODIC_WORK_NAME = "timeline_widget_periodic_sync"
    private const val IMMEDIATE_WORK_NAME = "timeline_widget_immediate_sync"
    private const val MIN_ALLOWED_INTERVAL_MINUTES = 15L
}

