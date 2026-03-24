import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PianoHero] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6"
          role="alert"
          data-testid="error-boundary-fallback"
        >
          <div className="max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle size={64} className="text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              PianoHero encountered an unexpected error. Don't worry — your saved data is safe.
            </p>
            {this.state.error && (
              <details className="text-left bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <summary className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <RefreshCw size={16} />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
