import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 에러가 발생하면 상태를 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error("🚨 [ERROR BOUNDARY] React error caught:", error);
    console.error("🚨 [ERROR BOUNDARY] Error info:", errorInfo);
    console.error(
      "🚨 [ERROR BOUNDARY] Component stack:",
      errorInfo.componentStack,
    );

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              🚨 Something went wrong
            </h1>
            <div className="bg-red-100 border border-red-400 rounded p-4 mb-4">
              <h2 className="font-semibold text-red-800 mb-2">
                Error Details:
              </h2>
              <p className="text-sm text-red-700 mb-2">
                <strong>Message:</strong>{" "}
                {this.state.error && this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="text-sm text-red-700">
                  <summary className="cursor-pointer font-medium">
                    Component Stack
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-red-50 p-2 rounded border overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() =>
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  })
                }
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Please check the browser console for more detailed error
                information.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
