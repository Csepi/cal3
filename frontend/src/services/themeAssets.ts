import '@fontsource-variable/inter/index.css';

let initialized = false;

export const bootstrapThemeAssets = (): void => {
  if (initialized || typeof document === 'undefined') {
    return;
  }
  initialized = true;
};
