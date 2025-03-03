"use client";

import React from "react";

interface LoadingIndicatorProps {
  size?: "small" | "medium" | "large";
  message?: string;
}

export default function LoadingIndicator({
  size = "medium",
  message = "Loading...",
}: LoadingIndicatorProps) {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full border-t-yellow-500 border-yellow-200 animate-spin`}
      />
      {message && <p className="text-yellow-200 font-medium">{message}</p>}
    </div>
  );
}
