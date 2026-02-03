/**
 * Context metadata attached to errors for tracing and diagnostics.
 */
export interface ErrorContext {
  /**
   * Request identifier used for tracing.
   */
  requestId?: string | null;
  /**
   * User identifier associated with the action.
   */
  userId?: string | number | null;
  /**
   * High-level action name (service/method).
   */
  action?: string;
  /**
   * Arbitrary metadata attached to the error.
   */
  metadata?: Record<string, unknown>;
  /**
   * Stack trace captured at the time of error handling.
   */
  stack?: string;
}

/**
 * Normalize error context to ensure required fields exist.
 */
export const buildErrorContext = (
  context: Partial<ErrorContext> = {},
  error?: unknown,
): ErrorContext => {
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    requestId: context.requestId ?? null,
    userId: context.userId ?? null,
    action: context.action,
    metadata: context.metadata,
    stack: context.stack ?? stack,
  };
};

/**
 * Merge context information into an existing context.
 */
export const mergeErrorContext = (
  base: ErrorContext,
  patch: Partial<ErrorContext> = {},
): ErrorContext => ({
  requestId: patch.requestId ?? base.requestId ?? null,
  userId: patch.userId ?? base.userId ?? null,
  action: patch.action ?? base.action,
  metadata: { ...(base.metadata || {}), ...(patch.metadata || {}) },
  stack: patch.stack ?? base.stack,
});
