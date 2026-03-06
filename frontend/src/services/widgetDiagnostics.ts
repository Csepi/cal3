import { Capacitor, registerPlugin } from '@capacitor/core';
import { clientLogger } from '../utils/clientLogger';

interface TimelineWidgetDiagnosticsPlugin {
  getLogs(): Promise<{ log?: string }>;
  clearLogs(): Promise<void>;
}

const timelineWidgetDiagnostics = registerPlugin<TimelineWidgetDiagnosticsPlugin>(
  'TimelineWidgetDiagnostics',
);

const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const getWidgetDiagnosticsLog = async (): Promise<string> => {
  if (!isNativeAndroid()) {
    return 'Widget diagnostics are available only in the Android mobile app.';
  }

  try {
    const result = await timelineWidgetDiagnostics.getLogs();
    return result?.log?.trim() || 'No widget diagnostics available yet.';
  } catch (error) {
    clientLogger.warn('[widget-diagnostics] Failed to read widget log', error);
    return `Failed to read widget diagnostics: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
};

export const clearWidgetDiagnosticsLog = async (): Promise<void> => {
  if (!isNativeAndroid()) {
    return;
  }
  try {
    await timelineWidgetDiagnostics.clearLogs();
  } catch (error) {
    clientLogger.warn('[widget-diagnostics] Failed to clear widget log', error);
  }
};

