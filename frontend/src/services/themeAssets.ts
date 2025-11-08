import '@fontsource-variable/inter/index.css';
import interLatinNormal from '@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url';
import { applyCspNonce } from '../utils/cspNonce';

let initialized = false;

export const bootstrapThemeAssets = (): void => {
  if (initialized || typeof document === 'undefined') {
    return;
  }
  initialized = true;

  if (
    !document.head.querySelector<HTMLLinkElement>(
      'link[data-primecal-font="inter"]',
    )
  ) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'font';
    preload.crossOrigin = 'anonymous';
    preload.href = interLatinNormal;
    preload.type = 'font/woff2';
    preload.setAttribute('data-primecal-font', 'inter');
    applyCspNonce(preload);
    document.head.appendChild(preload);
  }
};
