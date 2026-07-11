"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/** Shared design-language fallback used by the boundary and the route errors. */
export function ErrorFallback({
  title = "Something went wrong",
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card">
      <span
        className="p-3 rounded-full"
        style={{ background: "var(--accent-negative-glow)", color: "var(--accent-negative)" }}
      >
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-[16px] font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)] max-w-md">
          {detail ?? "The view hit an unexpected error. Your saved plan data is untouched."}
        </p>
      </div>
      <button
        onClick={onRetry ?? (() => window.location.reload())}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-[var(--text-inverse)] bg-[var(--accent-primary)] hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Reload
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Small client error boundary with a design-language "reload" fallback. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
        )
      );
    }
    return this.props.children;
  }
}
