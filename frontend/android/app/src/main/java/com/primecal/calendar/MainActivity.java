package com.primecal.calendar;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.primecal.calendar.widget.WidgetAuthStoragePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetAuthStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
