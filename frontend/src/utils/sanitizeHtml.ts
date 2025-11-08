import createDOMPurify from 'dompurify';

const windowRef: Window | undefined =
  typeof window !== 'undefined' ? window : undefined;
const purifier = windowRef ? createDOMPurify(windowRef) : null;

export const sanitizeHtml = (dirty: string): string => {
  if (!purifier || typeof dirty !== 'string') {
    return dirty;
  }

  return purifier.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms|cid|data:image\/[a-zA-Z]+;base64)[^]*)$/,
  });
};

export const createSanitizedMarkup = (dirty: string): { __html: string } => ({
  __html: sanitizeHtml(dirty),
});
