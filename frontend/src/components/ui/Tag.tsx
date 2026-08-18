"use client";
import React from "react";

type TagVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
type TagSize = "sm" | "md" | "lg";

interface TagProps {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<TagVariant, string> = {
  default: "tag-default",
  primary: "tag-primary",
  success: "tag-success",
  warning: "tag-warning",
  danger: "tag-danger",
  info: "tag-info",
  outline: "tag-outline",
};

const sizeClasses: Record<TagSize, string> = {
  sm: "tag-sm",
  md: "tag-md",
  lg: "tag-lg",
};

export default function Tag({
  label,
  variant = "default",
  size = "md",
  dismissible = false,
  onDismiss,
  icon,
  className = "",
  onClick,
}: TagProps) {
  const isClickable = !!onClick;

  const classes = [
    "tag",
    variantClasses[variant],
    sizeClasses[size],
    isClickable ? "tag-clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && onClick?.() : undefined}
    >
      {icon && <span className="tag-icon">{icon}</span>}
      <span className="tag-label">{label}</span>
      {dismissible && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          className="tag-dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
        >
          ✕
        </button>
      )}
    </span>
  );
}

interface TagListProps {
  tags: string[];
  variant?: TagVariant;
  size?: TagSize;
  dismissible?: boolean;
  onDismiss?: (tag: string, index: number) => void;
  className?: string;
}

export function TagList({ tags, variant, size, dismissible, onDismiss, className = "" }: TagListProps) {
  return (
    <div className={`tag-list ${className}`}>
      {tags.map((tag, i) => (
        <Tag
          key={`${tag}-${i}`}
          label={tag}
          variant={variant}
          size={size}
          dismissible={dismissible}
          onDismiss={() => onDismiss?.(tag, i)}
        />
      ))}
    </div>
  );
}
