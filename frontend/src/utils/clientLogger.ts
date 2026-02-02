type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type ConsoleMethod = 'log' | 'debug' | 'info' | 'warn' | 'error';
type LogArgs = [contextOrMessage?: unknown, ...rest: unknown[]];

interface NormalizedLog {
  context?: string;
  message: string;
  details?: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CONSOLE_TO_LEVEL: Record<ConsoleMethod, LogLevel> = {
  log: 'info',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const PREFIX = '[PrimeCal]';
const DEDUPE_WINDOW_MS = 1500;
const dedupeCache = new Map<
  string,
  { timer: ReturnType<typeof setTimeout>; suppressed: number }
>();

const originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

interface RuntimeLogScope {
  ENV?: { LOG_LEVEL?: unknown };
  CONFIG?: { LOG_LEVEL?: unknown };
}

const parseEnvLevel = (): LogLevel => {
  const fallback = import.meta.env.DEV ? 'debug' : 'warn';
  const runtimeScope = globalThis as RuntimeLogScope;
  const explicit =
    runtimeScope.ENV?.LOG_LEVEL ??
    runtimeScope.CONFIG?.LOG_LEVEL ??
    import.meta.env.VITE_LOG_LEVEL;
  if (typeof explicit !== 'string') {
    return fallback;
  }
  const normalized = explicit.toLowerCase();
  return ['debug', 'info', 'warn', 'error'].includes(normalized)
    ? (normalized as LogLevel)
    : fallback;
};

let minLevel: LogLevel = parseEnvLevel();
let consolePatched = false;

const extractContextPrefix = (
  value: string,
): { context?: string; message: string } => {
  const contextMatch = value.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
  if (contextMatch) {
    return {
      context: contextMatch[1],
      message: contextMatch[2] || '',
    };
  }
  return { message: value };
};

const normaliseArgs = (args: LogArgs): NormalizedLog => {
  if (!args.length) {
    return { message: '' };
  }

  const [first, second, third] = args;

  if (
    typeof first === 'object' &&
    first !== null &&
    'message' in (first as Record<string, unknown>)
  ) {
    const payload = first as NormalizedLog;
    return {
      context: payload.context,
      message: payload.message,
      details:
        payload.details !== undefined
          ? payload.details
          : second !== undefined
            ? second
            : undefined,
    };
  }

  if (typeof first === 'string' && typeof second === 'string') {
    return {
      context: first,
      message: second,
      details: third,
    };
  }

  if (typeof first === 'string') {
    const { context, message } = extractContextPrefix(first);
    return {
      context,
      message,
      details: second,
    };
  }

  return {
    message: JSON.stringify(first),
    details: second,
  };
};

const formatEntry = (
  level: LogLevel,
  entry: NormalizedLog & { timestamp?: string; repeatSuffix?: string },
) => {
  const parts = [
    PREFIX,
    `[${entry.timestamp ?? new Date().toISOString()}]`,
    `[${level.toUpperCase()}]`,
    entry.context ? `[${entry.context}]` : null,
    entry.message,
    entry.repeatSuffix ? `(${entry.repeatSuffix})` : null,
  ].filter(Boolean);

  if (entry.details !== undefined) {
    return [...parts, entry.details];
  }
  return parts;
};

const shouldLog = (level: LogLevel) =>
  LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];

const dedupeKey = (level: LogLevel, entry: NormalizedLog) =>
  `${level}:${entry.context ?? '_'}:${entry.message}`;

const scheduleDedupeFlush = (key: string, level: LogLevel, entry: NormalizedLog) => {
  const cached = dedupeCache.get(key);
  if (!cached) return;
  cached.timer = setTimeout(() => {
    const current = dedupeCache.get(key);
    if (!current) return;
    if (current.suppressed > 0) {
      const summary = {
        ...entry,
        message: `${entry.message}`,
        repeatSuffix: `${current.suppressed}x more`,
      };
      emitToConsole(level, summary);
    }
    dedupeCache.delete(key);
  }, DEDUPE_WINDOW_MS);
};

const applyDedupe = (level: LogLevel, entry: NormalizedLog): boolean => {
  if (level === 'warn' || level === 'error') {
    return false;
  }
  const key = dedupeKey(level, entry);
  const cached = dedupeCache.get(key);
  if (!cached) {
    const timer = setTimeout(() => scheduleDedupeFlush(key, level, entry), DEDUPE_WINDOW_MS);
    dedupeCache.set(key, { timer, suppressed: 0 });
    return false;
  }
  clearTimeout(cached.timer);
  cached.suppressed += 1;
  scheduleDedupeFlush(key, level, entry);
  return true;
};

const emitToConsole = (level: LogLevel, entry: NormalizedLog & { timestamp?: string; repeatSuffix?: string }) => {
  const method: ConsoleMethod =
    level === 'debug' ? 'debug' : level === 'info' ? 'info' : level;
  originalConsole[method](...formatEntry(level, entry));
};

const emit = (level: LogLevel, ...args: LogArgs) => {
  if (!shouldLog(level)) return;

  const normalized = normaliseArgs(args);
  const entry = { ...normalized, timestamp: new Date().toISOString() };
  if (applyDedupe(level, entry)) {
    return;
  }
  emitToConsole(level, entry);
};

export const clientLogger = {
  debug: (...args: LogArgs) => emit('debug', ...args),
  info: (...args: LogArgs) => emit('info', ...args),
  warn: (...args: LogArgs) => emit('warn', ...args),
  error: (...args: LogArgs) => emit('error', ...args),
  setLevel: (level: LogLevel) => {
    minLevel = level;
  },
};

export const installClientLogger = () => {
  if (consolePatched || typeof window === 'undefined') {
    return;
  }
  consolePatched = true;

  (Object.keys(CONSOLE_TO_LEVEL) as ConsoleMethod[]).forEach((method) => {
    console[method] = (...args: unknown[]) => {
      const level = CONSOLE_TO_LEVEL[method];
      emit(level, ...args);
    };
  });
};
