import React from "react";

interface BadgeProps {
  label: string;
  variant?: "verified" | "featured" | "new";
  className?: string;
}

export default function Badge({
  label,
  variant = "new",
  className = ""
}: BadgeProps) {
  const classes = [
    "custom-badge",
    `badge-${variant}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {variant === "verified" && "✓ "}
      {label}
    </span>
  );
}
