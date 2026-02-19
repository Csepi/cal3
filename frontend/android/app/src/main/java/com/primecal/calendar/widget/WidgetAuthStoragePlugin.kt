package com.primecal.calendar.widget

import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.JSObject

/**
 * Stores widget auth token in SharedPreferences so the Android widget can fetch timeline data.
 */
@CapacitorPlugin(name = "WidgetAuthStorage")
class WidgetAuthStoragePlugin : Plugin() {
    private fun prefs() = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @PluginMethod
    fun setWidgetToken(call: PluginCall) {
        val token = call.getString("token")
        if (token.isNullOrBlank()) {
            call.reject("token is required")
            return
        }
        val expiresAt = call.getLong("expiresAt") ?: 0L
        prefs().edit()
            .putString(KEY_TOKEN, token)
            .putLong(KEY_EXPIRES_AT, expiresAt)
            .apply()
        call.resolve()
    }

    @PluginMethod
    fun clearWidgetToken(call: PluginCall) {
        prefs().edit()
            .remove(KEY_TOKEN)
            .remove(KEY_EXPIRES_AT)
            .apply()
        call.resolve()
    }

    @PluginMethod
    fun getWidgetToken(call: PluginCall) {
        val payload = JSObject().apply {
            put("token", prefs().getString(KEY_TOKEN, null))
            put("expiresAt", prefs().getLong(KEY_EXPIRES_AT, 0L))
        }
        call.resolve(payload)
    }

    companion object {
        const val PREFS_NAME = "primecal_widget_auth"
        const val KEY_TOKEN = "token"
        const val KEY_EXPIRES_AT = "expiresAt"
    }
}

