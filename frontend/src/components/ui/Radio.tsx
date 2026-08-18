import React from "react";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Radio({
  label,
  error,
  className = "",
  id,
  ...props
}: RadioProps) {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <input
          id={radioId}
          type="radio"
          className={`h-4.5 w-4.5 border-gray-300 text-primary focus:ring-primary transition-all duration-200 cursor-pointer ${className}`}
          {...props}
        />
        <label htmlFor={radioId} className="text-sm font-medium text-gray-700 select-none cursor-pointer">
          {label}
        </label>
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-7">{error}</span>}
    </div>
  );
}
