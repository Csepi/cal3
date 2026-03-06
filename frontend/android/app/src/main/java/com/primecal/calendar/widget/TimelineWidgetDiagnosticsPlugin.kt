package com.primecal.calendar.widget

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Exposes timeline widget diagnostics logs to the web layer for copy/debug workflows.
 */
@CapacitorPlugin(name = "TimelineWidgetDiagnostics")
class TimelineWidgetDiagnosticsPlugin : Plugin() {
    @PluginMethod
    fun getLogs(call: PluginCall) {
        val payload = JSObject().apply {
            put("log", TimelineWidgetDebugLogger.snapshot(context))
        }
        call.resolve(payload)
    }

    @PluginMethod
    fun clearLogs(call: PluginCall) {
        TimelineWidgetDebugLogger.clear(context)
        call.resolve()
    }
}

