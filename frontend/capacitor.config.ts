import type { CapacitorConfig } from '@capacitor/cli';
import { resolveAppEnv } from '../config/app-env.js';

const appEnv = resolveAppEnv({ __source: 'capacitor-config' });
const serverUrl =
  appEnv.frontendUrl || `${appEnv.baseUrl}:${appEnv.frontendPort}`;
const allowHost = (() => {
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return serverUrl;
  }
})();

const config: CapacitorConfig = {
  appId: 'com.primecal.calendar',
  appName: 'PrimeCal Calendar',
  webDir: 'dist',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: allowHost ? [allowHost] : [],
  },
};

export default config;
