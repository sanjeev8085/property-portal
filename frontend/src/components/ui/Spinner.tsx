import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({
  size = "md",
  className = ""
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4"
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-primary border-l-transparent ${sizeClasses[size]} ${className}`}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-gray-150 rounded-xl overflow-hidden shadow-sm animate-pulse flex flex-col h-full bg-white">
      <div className="aspect-video w-full bg-gray-250" />
      <div className="p-4 flex flex-col flex-1 gap-3.5">
        <div className="flex flex-col gap-2">
          <div className="h-6 bg-gray-250 rounded w-1/3" />
          <div className="h-4.5 bg-gray-250 rounded w-3/4" />
          <div className="h-3.5 bg-gray-250 rounded w-1/2" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-full mt-auto py-1 border-t border-gray-100" />
        <div className="h-10 bg-gray-250 rounded w-full mt-1" />
      </div>
    </div>
  );
}
