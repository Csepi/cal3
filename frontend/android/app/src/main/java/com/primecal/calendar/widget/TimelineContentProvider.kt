package com.primecal.calendar.widget

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri

/**
 * Content provider used by widget components to read cached timeline entries.
 * This keeps widget data access decoupled from the UI container implementation.
 */
class TimelineContentProvider : ContentProvider() {
    override fun onCreate(): Boolean = true

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor {
        if (uriMatcher.match(uri) != CODE_TIMELINE) {
            throw IllegalArgumentException("Unsupported URI: $uri")
        }

        val context = context ?: return MatrixCursor(COLUMNS)
        val (entries) = TimelineWidgetPreferences.loadCachedEntries(context)
        val cursor = MatrixCursor(COLUMNS)
        entries.forEach { entry ->
            cursor.addRow(
                arrayOf(
                    entry.id,
                    entry.title,
                    entry.description ?: "",
                    entry.startAtMillis,
                    entry.endAtMillis ?: 0L,
                    entry.category ?: "",
                    entry.colorHex ?: "",
                    entry.icon ?: "",
                    entry.status ?: "",
                ),
            )
        }
        return cursor
    }

    override fun getType(uri: Uri): String {
        return when (uriMatcher.match(uri)) {
            CODE_TIMELINE -> "vnd.android.cursor.dir/$AUTHORITY.timeline"
            else -> throw IllegalArgumentException("Unsupported URI: $uri")
        }
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int = 0

    companion object {
        const val AUTHORITY = "com.primecal.calendar.provider.timeline"
        val TIMELINE_URI: Uri = Uri.parse("content://$AUTHORITY/timeline")

        private const val CODE_TIMELINE = 100
        private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "timeline", CODE_TIMELINE)
        }

        val COLUMNS = arrayOf(
            "_id",
            "title",
            "description",
            "startAtMillis",
            "endAtMillis",
            "category",
            "colorHex",
            "icon",
            "status",
        )
    }
}
