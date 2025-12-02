
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  // FIX: Explicitly declare props to satisfy strict TypeScript environments if
  // type inference from React.Component is somehow not fully propagated.
  // This line is usually implicitly handled by React.Component but might be needed
  // in specific configurations or if the linter/compiler misinterprets context.
  public readonly props: Props;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full border border-slate-200">
            <div className="mb-4 text-rose-500 flex justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
            <p className="text-slate-600 mb-6">O sistema encontrou um erro inesperado.</p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Recarregar Sistema
            </button>

            {this.state.error && (
                <div className="mt-6 text-left">
                    <details className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500 overflow-auto max-h-32">
                        <summary className="cursor-pointer font-medium mb-1">Detalhes técnicos</summary>
                        <pre className="whitespace-pre-wrap font-mono">{this.state.error.toString()}</pre>
                    </details>
                </div>
            )}
          </div>
        </div>
      );
    }

    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;