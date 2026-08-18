import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Checkbox({
  label,
  error,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <input
          id={checkboxId}
          type="checkbox"
          className={`h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary transition-all duration-200 cursor-pointer ${className}`}
          {...props}
        />
        <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700 select-none cursor-pointer">
          {label}
        </label>
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-7">{error}</span>}
    </div>
  );
}
