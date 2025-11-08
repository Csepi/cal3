const CSRF_COOKIE_NAME = 'cal3_csrf_token';
const TOKEN_LENGTH = 32;
const CSRF_HEADER = 'X-CSRF-Token';

const isBrowser = typeof document !== 'undefined';

const readCookie = (name: string): string | null => {
  if (!isBrowser) return null;
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
};

const writeCookie = (name: string, value: string, maxAgeDays = 180): void => {
  if (!isBrowser) return;
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  const expires = new Date(Date.now() + maxAgeDays * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Path=/; SameSite=Strict; Expires=${expires}${secureFlag}`;
};

const deleteCookie = (name: string): void => {
  if (!isBrowser) return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
};

const generateToken = (length = TOKEN_LENGTH): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (value) => charset[value % charset.length]).join(
      '',
    );
  }

  let token = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * charset.length);
    token += charset[index];
  }
  return token;
};

export const getCsrfToken = (): string | null => {
  return readCookie(CSRF_COOKIE_NAME);
};

export const ensureCsrfToken = (): string => {
  let token = getCsrfToken();
  if (!token) {
    token = generateToken();
    writeCookie(CSRF_COOKIE_NAME, token);
  }
  return token;
};

export const clearCsrfToken = (): void => {
  deleteCookie(CSRF_COOKIE_NAME);
};

export const applyCsrfHeader = (
  headers: Headers,
  force = false,
): void => {
  const token = force ? ensureCsrfToken() : getCsrfToken();
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
};
