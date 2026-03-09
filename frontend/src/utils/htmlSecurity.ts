import createDOMPurify from 'dompurify';

const windowRef: (Window & typeof globalThis) | undefined =
  typeof window !== 'undefined'
    ? (window as Window & typeof globalThis)
    : undefined;
const purifier = windowRef ? createDOMPurify(windowRef) : null;

export const encodeHtmlEntities = (value: unknown): string => {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const sanitizeHtml = (dirty: string): string => {
  if (!purifier || typeof dirty !== 'string') {
    return dirty;
  }

  return purifier.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|sms|cid|data:image\/[a-zA-Z]+;base64)[^]*)$/,
  });
};

export const createSanitizedMarkup = (dirty: string): { __html: string } => ({
  __html: sanitizeHtml(dirty),
});

export const renderSafeTemplate = (
  template: string,
  context: Record<string, unknown>,
): string => {
  if (typeof template !== 'string') {
    return '';
  }
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const parts = key.split('.');
    let value: unknown = context;
    for (const part of parts) {
      if (!value || typeof value !== 'object' || !(part in value)) {
        value = '';
        break;
      }
      value = (value as Record<string, unknown>)[part];
    }
    return encodeHtmlEntities(value);
  });
};
