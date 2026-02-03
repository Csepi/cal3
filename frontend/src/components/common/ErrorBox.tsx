import React, { useState } from 'react';

export type ErrorDetails = {
  message: string;
  timestamp?: string;
  url?: string;
  status?: number;
  statusText?: string;
  stack?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  headers?: Record<string, string>;
  [key: string]: unknown;
};

interface ErrorBoxProps {
  error: string | Error | ErrorDetails;
  title?: string;
  className?: string;
  onClose?: () => void;
}

export const ErrorBox: React.FC<ErrorBoxProps> = ({
  error,
  title = 'Error',
  className = '',
  onClose
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse error into structured format
  const parseError = (): ErrorDetails => {
    if (typeof error === 'string') {
      return {
        message: error,
        timestamp: new Date().toISOString(),
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }

    // Already structured
    return {
      ...error,
      timestamp: error.timestamp || new Date().toISOString(),
    };
  };

  const errorDetails = parseError();

  // Generate debug log for clipboard
  const generateDebugLog = (): string => {
    const log: string[] = [];

    log.push('='.repeat(60));
    log.push('PrimeCal Calendar - Error Debug Log');
    log.push('='.repeat(60));
    log.push('');
    log.push(`Timestamp: ${errorDetails.timestamp}`);
    log.push(`Error Message: ${errorDetails.message}`);
    log.push('');

    if (errorDetails.url) {
      log.push(`URL: ${errorDetails.url}`);
    }

    if (errorDetails.status) {
      log.push(`HTTP Status: ${errorDetails.status} ${errorDetails.statusText || ''}`);
    }

    if (errorDetails.requestBody) {
      log.push('');
      log.push('Request Body:');
      log.push(JSON.stringify(errorDetails.requestBody, null, 2));
    }

    if (errorDetails.responseBody) {
      log.push('');
      log.push('Response Body:');
      log.push(JSON.stringify(errorDetails.responseBody, null, 2));
    }

    if (errorDetails.headers) {
      log.push('');
      log.push('Headers:');
      Object.entries(errorDetails.headers).forEach(([key, value]) => {
        log.push(`  ${key}: ${value}`);
      });
    }

    if (errorDetails.stack) {
      log.push('');
      log.push('Stack Trace:');
      log.push(errorDetails.stack);
    }

    // Add other custom properties
    const standardKeys = ['message', 'timestamp', 'url', 'status', 'statusText', 'stack', 'requestBody', 'responseBody', 'headers'];
    const customKeys = Object.keys(errorDetails).filter(key => !standardKeys.includes(key));
    if (customKeys.length > 0) {
      log.push('');
      log.push('Additional Information:');
      customKeys.forEach(key => {
        const value = errorDetails[key];
        if (typeof value === 'object') {
          log.push(`${key}:`);
          log.push(JSON.stringify(value, null, 2));
        } else {
          log.push(`${key}: ${value}`);
        }
      });
    }

    log.push('');
    log.push('='.repeat(60));
    log.push('System Information:');
    log.push('='.repeat(60));
    log.push(`User Agent: ${navigator.userAgent}`);
    log.push(`Platform: ${navigator.platform}`);
    log.push(`Language: ${navigator.language}`);
    log.push(`URL: ${window.location.href}`);
    log.push(`Screen: ${window.screen.width}x${window.screen.height}`);
    log.push('');

    return log.join('\n');
  };

  const handleCopyDebugLog = async () => {
    try {
      const debugLog = generateDebugLog();
      await navigator.clipboard.writeText(debugLog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  return (
    <div className={`bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <svg
            className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
            <p className="text-red-700 whitespace-pre-wrap break-words">{errorDetails.message}</p>

            {(errorDetails.status || errorDetails.url) && (
              <div className="mt-3 text-sm text-red-600">
                {errorDetails.status && (
                  <div>Status: {errorDetails.status} {errorDetails.statusText}</div>
                )}
                {errorDetails.url && (
                  <div className="truncate" title={errorDetails.url}>URL: {errorDetails.url}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors ml-4"
            aria-label="Close error message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>

        <button
          onClick={handleCopyDebugLog}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Debug Log
            </>
          )}
        </button>
      </div>

      {/* Debug Information Panel */}
      {showDebug && (
        <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4 max-h-96 overflow-auto">
          <h4 className="text-sm font-semibold text-red-900 mb-3">Debug Information</h4>
          <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap break-all">
            {generateDebugLog()}
          </pre>
        </div>
      )}
    </div>
  );
};

// Export both named and default for compatibility
export default ErrorBox;
