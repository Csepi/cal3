import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { bootstrapThemeAssets } from './services/themeAssets';
import { installClientLogger, clientLogger } from './utils/clientLogger';
import queryClient from './services/queryClient';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import { errorReportingService } from './services/errorReportingService';
import { mobileCrashReporter } from './services/mobileCrashReporter';
import './index.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/mobile.css';
import './i18n';
import App from './App.tsx';

installClientLogger();
clientLogger.info('client', 'Logger initialised', {
  level: import.meta.env.VITE_LOG_LEVEL ?? (import.meta.env.DEV ? 'debug' : 'warn'),
});

bootstrapThemeAssets();
errorReportingService.installGlobalHandlers();
mobileCrashReporter.install();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary fallbackTitle="PrimeCal failed to render">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
