"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ErrorBoundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="w-full max-w-lg">
        <ErrorFallback
          title="This page hit an error"
          detail="An unexpected error interrupted the OAKOC planner. Your saved plan data is untouched — reload to continue."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
