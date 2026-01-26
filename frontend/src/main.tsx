import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { bootstrapThemeAssets } from './services/themeAssets';
import { installClientLogger, clientLogger } from './utils/clientLogger';
import queryClient from './services/queryClient';
import './index.css';
import './styles/animations.css';
import './styles/mobile.css';
import './i18n';
import App from './App.tsx';

installClientLogger();
clientLogger.info('client', 'Logger initialised', {
  level: import.meta.env.VITE_LOG_LEVEL ?? (import.meta.env.DEV ? 'debug' : 'warn'),
});

bootstrapThemeAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
