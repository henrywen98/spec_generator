'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Error callback for logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for export components
 * Catches and displays export errors gracefully
 */
export class ExportErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('Export Error:', error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-red-800">
              导出功能出现问题
            </p>
            <p className="text-xs text-red-600 truncate">
              {this.state.error?.message || '未知错误'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label="重试导出"
          >
            <RefreshCw size={12} aria-hidden="true" />
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly wrapper for export error boundary
 */
export function withExportErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ExportErrorBoundary onError={onError}>
        <WrappedComponent {...props} />
      </ExportErrorBoundary>
    );
  };
}
