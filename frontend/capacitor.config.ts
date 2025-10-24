import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cal3.calendar',
  appName: 'Cal3 Calendar',
  webDir: 'dist',
  server: {
    // Load frontend from remote server
    url: 'http://www.cselo.hu:8079',
    // Allow cleartext (HTTP) traffic
    cleartext: true,
    // Optional: Allow navigation to this host
    allowNavigation: ['www.cselo.hu']
  }
};

export default config;
