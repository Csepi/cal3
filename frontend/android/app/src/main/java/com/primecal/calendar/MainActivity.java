package com.primecal.calendar;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.primecal.calendar.widget.WidgetAuthStoragePlugin;
import com.primecal.calendar.widget.TimelineWidgetDiagnosticsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetAuthStoragePlugin.class);
        registerPlugin(TimelineWidgetDiagnosticsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
