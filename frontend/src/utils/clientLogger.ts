const PREFIX = '[PrimeCal]';

type LogArgs = [message?: unknown, ...optionalParams: unknown[]];

const emit = (
  method: 'debug' | 'info' | 'warn' | 'error',
  ...args: LogArgs
): void => {
  // eslint-disable-next-line no-console
  console[method](PREFIX, ...args);
};

export const clientLogger = {
  debug: (...args: LogArgs) => emit('debug', ...args),
  info: (...args: LogArgs) => emit('info', ...args),
  warn: (...args: LogArgs) => emit('warn', ...args),
  error: (...args: LogArgs) => emit('error', ...args),
};
