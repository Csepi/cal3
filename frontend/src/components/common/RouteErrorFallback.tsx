import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import ErrorBox from './ErrorBox';
import { errorReportingService } from '../../services/errorReportingService';

import { tStatic } from '../../i18n';

const normalizeRouteError = (error: unknown): { message: string; stack?: string } => {
  if (isRouteErrorResponse(error)) {
    return {
      message: `${error.status} ${error.statusText}`,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
};

export const RouteErrorFallback: React.FC = () => {
  const routeError = useRouteError();
  const normalized = normalizeRouteError(routeError);

  React.useEffect(() => {
    void errorReportingService.capture(
      'react.router',
      normalized.message,
      { stack: normalized.stack },
      'error',
    );
  }, [normalized.message, normalized.stack]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <ErrorBox
          title={tStatic('common:auto.frontend.k7f7a2327a0b7')}
          error={{
            message:
              'This view failed to load. You can navigate back or refresh the page.',
            stack: normalized.stack,
            routeError: normalized.message,
          }}
        />
      </div>
    </div>
  );
};

export default RouteErrorFallback;
