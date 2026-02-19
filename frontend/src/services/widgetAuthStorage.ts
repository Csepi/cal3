import { Capacitor, registerPlugin } from '@capacitor/core';
import { BASE_URL } from '../config/apiConfig';
import { clientLogger } from '../utils/clientLogger';

interface WidgetAuthStoragePlugin {
  setWidgetToken(options: { token: string; expiresAt: number }): Promise<void>;
  clearWidgetToken(): Promise<void>;
}

interface WidgetTokenApiResponse {
  widget_token?: string;
  expires_in?: number;
  expires_at?: string;
}

const widgetAuthStorage = registerPlugin<WidgetAuthStoragePlugin>('WidgetAuthStorage');

const FALLBACK_WIDGET_TOKEN_TTL_MS = 10 * 60 * 1000;

const unwrapApiResponse = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const isNative = (): boolean => Capacitor.isNativePlatform();

export const syncWidgetToken = async (accessToken: string | null | undefined): Promise<void> => {
  if (!accessToken || !isNative()) {
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/widget-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const json = await response.json().catch(() => null);
      const payload = json ? unwrapApiResponse<WidgetTokenApiResponse>(json) : null;
      const token = payload?.widget_token || accessToken;
      const expiresAtFromApi =
        payload?.expires_at ? Date.parse(payload.expires_at) : NaN;
      const expiresAt =
        Number.isFinite(expiresAtFromApi) && expiresAtFromApi > Date.now()
          ? expiresAtFromApi
          : Date.now() + ((payload?.expires_in ?? 900) * 1000);
      await widgetAuthStorage.setWidgetToken({
        token,
        expiresAt,
      });
      return;
    }

    clientLogger.warn('[widget-auth] Widget token endpoint failed, using short-lived fallback token', {
      status: response.status,
    });
  } catch (error) {
    clientLogger.warn('[widget-auth] Widget token sync failed, using short-lived fallback token', error);
  }

  try {
    await widgetAuthStorage.setWidgetToken({
      token: accessToken,
      expiresAt: Date.now() + FALLBACK_WIDGET_TOKEN_TTL_MS,
    });
  } catch (error) {
    clientLogger.warn('[widget-auth] Failed to persist fallback widget token', error);
  }
};

export const clearWidgetToken = async (): Promise<void> => {
  if (!isNative()) {
    return;
  }
  try {
    await widgetAuthStorage.clearWidgetToken();
  } catch (error) {
    clientLogger.warn('[widget-auth] Failed to clear widget token', error);
  }
};

