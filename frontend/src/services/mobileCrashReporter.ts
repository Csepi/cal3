import { isNativeClient } from './clientPlatform';
import { errorReportingService } from './errorReportingService';
import { clientLogger } from '../utils/clientLogger';

export interface MobileCrashReporterConfig {
  provider: 'sentry' | 'bugsnag' | 'none';
  dsn?: string;
  enabled: boolean;
}

const resolveConfig = (): MobileCrashReporterConfig => {
  const providerRaw = (import.meta.env.VITE_MOBILE_CRASH_PROVIDER ?? 'none')
    .toString()
    .toLowerCase();
  const provider =
    providerRaw === 'sentry' || providerRaw === 'bugsnag'
      ? providerRaw
      : 'none';
  return {
    provider,
    dsn: import.meta.env.VITE_MOBILE_CRASH_DSN?.toString(),
    enabled: isNativeClient(),
  };
};

export class MobileCrashReporter {
  private installed = false;
  private readonly config: MobileCrashReporterConfig = resolveConfig();

  install(): void {
    if (this.installed || !this.config.enabled) {
      return;
    }
    this.installed = true;

    if (this.config.provider !== 'none' && this.config.dsn) {
      clientLogger.info('mobile-crash', `mobile crash reporting configured (${this.config.provider})`);
    } else {
      clientLogger.warn(
        'mobile-crash',
        'native crash provider not configured; falling back to backend error intake',
      );
    }
  }

  async report(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown mobile error';
    await errorReportingService.capture(
      'mobile.crash',
      message,
      {
        stack: error instanceof Error ? error.stack : undefined,
        provider: this.config.provider,
        ...context,
      },
    );
  }
}

export const mobileCrashReporter = new MobileCrashReporter();
