package com.primecal.calendar.widget

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/**
 * Background worker for periodic widget updates.
 */
class TimelineWidgetWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        return runCatching {
            val forceRefresh = inputData.getBoolean(KEY_FORCE_REFRESH, false)
            TimelineWidgetProvider.refreshAllWidgets(applicationContext, forceRefresh)
            Result.success()
        }.getOrElse { Result.retry() }
    }

    companion object {
        const val KEY_FORCE_REFRESH = "force_refresh"
    }
}

