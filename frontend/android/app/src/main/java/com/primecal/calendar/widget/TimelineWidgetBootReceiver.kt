package com.primecal.calendar.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-registers periodic update work after device reboot or major clock changes.
 */
class TimelineWidgetBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            TimelineWidgetUpdateScheduler.schedulePeriodic(context)
            TimelineWidgetProvider.refreshAllWidgets(context, forceRefresh = false)
        }
    }
}

