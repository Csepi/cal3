import React from 'react';
import ErrorBox from './ErrorBox';
import { errorReportingService } from '../../services/errorReportingService';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  inline?: boolean;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    void errorReportingService.capture('react.error-boundary', error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    return (
      <div
        className={
          this.props.inline
            ? 'w-full rounded-xl border border-red-200 bg-red-50/60 p-4'
            : 'min-h-screen bg-gray-50 flex items-center justify-center p-4'
        }
      >
        <div className={this.props.inline ? 'w-full space-y-4' : 'w-full max-w-3xl space-y-4'}>
          <ErrorBox
            title={this.props.fallbackTitle ?? 'Something went wrong'}
            error={{
              message:
                'The application hit an unexpected error. The incident was logged automatically.',
              stack: this.state.error.stack,
              errorName: this.state.error.name,
              originalMessage: this.state.error.message,
            }}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Reload application
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
