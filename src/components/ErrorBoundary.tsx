import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Send error to monitoring service (Sentry, etc.)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, this would send to Sentry or similar service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error('Production error report:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Something went wrong
              </h1>
              
              <p className="text-gray-400 mb-6">
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
              </p>

              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                  <h3 className="text-red-400 font-medium mb-2">Error Details:</h3>
                  <p className="text-red-300 text-sm font-mono mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer text-red-400 mb-2">
                        Stack Trace
                      </summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-xs text-gray-400">
                      <summary className="cursor-pointer text-red-400 mb-2">
                        Component Stack
                      </summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  If this problem persists, please contact support with the error details above.
                </p>
                <p className="mt-1">
                  Error ID: {this.state.error?.message?.slice(0, 8) || 'unknown'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
