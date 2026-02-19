package com.primecal.calendar.widget

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import androidx.appcompat.app.AppCompatActivity
import com.primecal.calendar.R

/**
 * Configuration UI shown when the user adds the timeline widget.
 */
class TimelineWidgetConfigActivity : AppCompatActivity() {
    private var appWidgetId: Int = AppWidgetManager.INVALID_APPWIDGET_ID

    private lateinit var dateRangeSpinner: Spinner
    private lateinit var entriesSpinner: Spinner
    private lateinit var colorSchemeSpinner: Spinner
    private lateinit var refreshSpinner: Spinner
    private lateinit var clickBehaviorSpinner: Spinner
    private lateinit var saveButton: Button
    private lateinit var cancelButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_timeline_widget_config)
        setResult(RESULT_CANCELED)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID,
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        dateRangeSpinner = findViewById(R.id.configDateRange)
        entriesSpinner = findViewById(R.id.configEntryLimit)
        colorSchemeSpinner = findViewById(R.id.configColorScheme)
        refreshSpinner = findViewById(R.id.configRefreshFrequency)
        clickBehaviorSpinner = findViewById(R.id.configClickBehavior)
        saveButton = findViewById(R.id.configSaveButton)
        cancelButton = findViewById(R.id.configCancelButton)

        bindSpinners()
        bindActions()
    }

    private fun bindSpinners() {
        dateRangeSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            TimelineDateRange.entries.map { getString(it.labelResId) },
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        entriesSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            entryCountOptions.map { getString(R.string.widget_entries_option, it) },
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        colorSchemeSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            TimelineWidgetColorScheme.entries.map { getString(it.labelResId) },
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        refreshSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            TimelineWidgetRefreshFrequency.entries.map { getString(it.labelResId) },
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        clickBehaviorSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            TimelineWidgetClickBehavior.entries.map { getString(it.labelResId) },
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        val config = TimelineWidgetPreferences.loadConfig(this, appWidgetId)
        dateRangeSpinner.setSelection(TimelineDateRange.entries.indexOf(config.dateRange))
        entriesSpinner.setSelection(entryCountOptions.indexOf(config.entryLimit).coerceAtLeast(0))
        colorSchemeSpinner.setSelection(TimelineWidgetColorScheme.entries.indexOf(config.colorScheme))
        refreshSpinner.setSelection(TimelineWidgetRefreshFrequency.entries.indexOf(config.refreshFrequency))
        clickBehaviorSpinner.setSelection(TimelineWidgetClickBehavior.entries.indexOf(config.clickBehavior))
    }

    private fun bindActions() {
        saveButton.setOnClickListener {
            val selectedConfig = TimelineWidgetConfig(
                dateRange = TimelineDateRange.entries[dateRangeSpinner.selectedItemPosition],
                entryLimit = entryCountOptions.getOrElse(entriesSpinner.selectedItemPosition) { 5 },
                colorScheme = TimelineWidgetColorScheme.entries[colorSchemeSpinner.selectedItemPosition],
                refreshFrequency = TimelineWidgetRefreshFrequency.entries[refreshSpinner.selectedItemPosition],
                clickBehavior = TimelineWidgetClickBehavior.entries[clickBehaviorSpinner.selectedItemPosition],
            )
            TimelineWidgetPreferences.saveConfig(this, appWidgetId, selectedConfig)
            TimelineWidgetPreferences.saveDateOffset(this, appWidgetId, 0)
            TimelineWidgetUpdateScheduler.schedulePeriodic(this)
            TimelineWidgetProvider.requestImmediateRefresh(this, appWidgetId)

            setResult(
                RESULT_OK,
                Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId),
            )
            finish()
        }

        cancelButton.setOnClickListener { finish() }
    }

    companion object {
        private val entryCountOptions = listOf(3, 5, 7, 10, 12)
    }
}

