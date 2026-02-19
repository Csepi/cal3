import type { CapacitorConfig } from '@capacitor/cli';

const DEFAULT_REMOTE_SERVER_URL = 'https://app.primecal.eu';
const DEFAULT_ALLOW_NAVIGATION_HOSTS = [
  'app.primecal.eu',
  'api.primecal.eu',
  'primecal.eu',
  '*.primecal.eu',
];

const normalizeServerUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  return `https://${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

const explicitServerUrl = normalizeServerUrl(
  process.env.CAPACITOR_SERVER_URL ||
    process.env.MOBILE_FRONTEND_URL ||
    process.env.FRONTEND_URL,
);
const serverUrl = explicitServerUrl || DEFAULT_REMOTE_SERVER_URL;

const allowNavigation = (() => {
  const hosts = new Set<string>(DEFAULT_ALLOW_NAVIGATION_HOSTS);

  for (const candidate of [serverUrl, explicitServerUrl]) {
    if (!candidate) {
      continue;
    }

    try {
      hosts.add(new URL(candidate).hostname);
    } catch {
      hosts.add(candidate);
    }
  }

  const configuredHosts = process.env.CAPACITOR_ALLOW_NAVIGATION;
  if (configuredHosts) {
    for (const host of configuredHosts.split(',')) {
      const trimmed = host.trim();
      if (trimmed) {
        hosts.add(trimmed);
      }
    }
  }

  return Array.from(hosts);
})();

const config: CapacitorConfig = {
  appId: 'com.primecal.calendar',
  appName: 'PrimeCal Calendar',
  webDir: 'dist',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation,
    androidScheme: 'https',
  },
};

export default config;
