const NONCE_META_NAME = 'csp-nonce';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Resolve the CSP nonce that the backend injects via meta tags or globals.
 * Returns null when no nonce is available so callers can gracefully skip it.
 */
export const getCspNonce = (): string | null => {
  if (typeof document !== 'undefined') {
    const meta = document.querySelector<HTMLMetaElement>(
      `meta[name="${NONCE_META_NAME}"]`,
    );
    const content = meta?.getAttribute('content');
    if (isNonEmptyString(content)) {
      return content.trim();
    }
  }

  const globalNonce = (globalThis as Record<string, unknown>).__CSP_NONCE__;
  return isNonEmptyString(globalNonce) ? globalNonce.trim() : null;
};

/**
 * Apply the active CSP nonce to a DOM node if one exists.
 * Helpful when injecting <style>/<link>/<script> elements at runtime.
 */
export const applyCspNonce = (
  node: HTMLElement | HTMLLinkElement | HTMLStyleElement,
): void => {
  const nonce = getCspNonce();
  if (nonce) {
    node.setAttribute('nonce', nonce);
  }
};
