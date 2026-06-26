import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render-time errors anywhere in the tree and shows a calm, friendly fallback. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the error for diagnostics; the UI stays calm for the user.
    console.error('Unexpected error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="grid min-h-[100dvh] place-items-center bg-page px-6 text-center">
        <div className="max-w-sm">
          <div className="mb-4 text-[44px]" aria-hidden="true">🌿</div>
          <h1 className="text-[26px] font-bold text-ink">Something went wrong</h1>
          <p className="mt-3 text-[17px] text-body2">Sorry — please try again.</p>
          {/* Plain <a> reload clears any bad in-memory state. */}
          <a
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-terracotta px-6 py-4 text-[17px] font-bold text-white shadow-btn"
          >
            Back to memories
          </a>
        </div>
      </div>
    );
  }
}
