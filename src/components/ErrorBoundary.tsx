"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by ErrorBoundary:", error);
      setHasError(true);
      setError(error.error);
    };

    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen game-table p-8 flex flex-col items-center justify-center">
        <div className="bg-red-900/80 rounded-lg p-8 max-w-md w-full border border-red-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-red-200 mb-6">
            {error?.message ||
              "An unexpected error occurred while loading the game."}
          </p>
          <div className="bg-red-950/50 p-4 rounded mb-6 max-h-32 overflow-auto">
            <pre className="text-xs text-red-300 whitespace-pre-wrap">
              {error?.stack || "No stack trace available"}
            </pre>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              onClick={() => {
                setHasError(false);
                setError(null);
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
