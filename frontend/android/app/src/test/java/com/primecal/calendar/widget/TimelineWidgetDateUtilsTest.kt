package com.primecal.calendar.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TimelineWidgetDateUtilsTest {
    @Test
    fun `today range shifts by one day per offset`() {
        val base = TimelineWidgetDateUtils.resolveRangeWindow(TimelineDateRange.TODAY, 0)
        val next = TimelineWidgetDateUtils.resolveRangeWindow(TimelineDateRange.TODAY, 1)
        val dayMs = 24L * 60L * 60L * 1000L
        assertTrue(next.startMillis - base.startMillis in (dayMs - 1_000)..(dayMs + 1_000))
    }

    @Test
    fun `config roundtrip persists enum values`() {
        val original = TimelineWidgetConfig(
            dateRange = TimelineDateRange.MONTH,
            entryLimit = 10,
            colorScheme = TimelineWidgetColorScheme.DARK,
            refreshFrequency = TimelineWidgetRefreshFrequency.HOUR_1,
            clickBehavior = TimelineWidgetClickBehavior.OPEN_DAY,
        )
        val roundTrip = TimelineWidgetConfig.fromPersistedMap(original.toPersistedMap())
        assertEquals(original, roundTrip)
    }
}

