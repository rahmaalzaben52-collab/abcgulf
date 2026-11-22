import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0C10] text-[#F4F5F7] flex items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/12 bg-[#14161E] p-6 space-y-4">
            <h1 className="text-xl font-bold text-[#F8F9FA]">
              حدث خطأ غير متوقع | Unexpected Error
            </h1>
            <p className="text-sm text-[#A9AFBE]">
              يرجى إعادة تحميل الصفحة للمتابعة.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#DFAF5A] text-[#0B0C10] px-4 py-2 text-sm font-bold cursor-pointer"
            >
              إعادة التحميل / Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
