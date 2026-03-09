import { BASE_URL } from '../config/apiConfig';
import { clientLogger } from '../utils/clientLogger';
import { isNativeClient } from './clientPlatform';

type FrontendErrorSeverity = 'error' | 'warn' | 'info';

export interface FrontendErrorReport {
  source: string;
  message: string;
  stack?: string;
  url?: string;
  severity?: FrontendErrorSeverity;
  details?: Record<string, unknown>;
}

const MAX_LOCAL_ERRORS = 80;
const LOCAL_STORAGE_KEY = 'primecal_frontend_error_buffer_v1';
const REPORT_RETRIES = 2;

const normalizeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
};

const nowIso = () => new Date().toISOString();

export class ErrorReportingService {
  private static singleton: ErrorReportingService;
  private installed = false;

  static instance(): ErrorReportingService {
    if (!ErrorReportingService.singleton) {
      ErrorReportingService.singleton = new ErrorReportingService();
    }
    return ErrorReportingService.singleton;
  }

  installGlobalHandlers(): void {
    if (this.installed || typeof window === 'undefined') {
      return;
    }
    this.installed = true;

    window.addEventListener('error', (event) => {
      const normalized = normalizeError(event.error ?? event.message);
      void this.capture('window.error', normalized.message, {
        stack: normalized.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const normalized = normalizeError(event.reason);
      void this.capture('window.unhandledrejection', normalized.message, {
        stack: normalized.stack,
      });
    });
  }

  async capture(
    source: string,
    message: string,
    details: Record<string, unknown> = {},
    severity: FrontendErrorSeverity = 'error',
  ): Promise<void> {
    const report: FrontendErrorReport = {
      source,
      message,
      severity,
      stack:
        typeof details.stack === 'string'
          ? details.stack
          : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      details: {
        ...details,
        timestamp: nowIso(),
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        platform:
          typeof navigator !== 'undefined' ? navigator.platform : undefined,
        isNativeClient: isNativeClient(),
      },
    };

    this.writeLocalBuffer(report);
    await this.sendWithRetry(report);
  }

  getBufferedErrors(): FrontendErrorReport[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as FrontendErrorReport[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeLocalBuffer(report: FrontendErrorReport): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const buffered = this.getBufferedErrors();
    buffered.unshift(report);
    const trimmed = buffered.slice(0, MAX_LOCAL_ERRORS);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      clientLogger.warn('error-reporting', 'failed to persist local error buffer', error);
    }
  }

  private async sendWithRetry(report: FrontendErrorReport): Promise<void> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= REPORT_RETRIES; attempt += 1) {
      try {
        await this.send(report);
        return;
      } catch (error) {
        lastError = error;
        if (attempt >= REPORT_RETRIES) {
          break;
        }
        await delay(200 * Math.pow(2, attempt));
      }
    }

    clientLogger.warn('error-reporting', 'failed to submit error report', {
      message: report.message,
      source: report.source,
      reason: normalizeError(lastError).message,
    });
  }

  private async send(report: FrontendErrorReport): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/monitoring/frontend-errors`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(`Error report rejected with status ${response.status}`);
    }
  }
}

const delay = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const errorReportingService = ErrorReportingService.instance();
